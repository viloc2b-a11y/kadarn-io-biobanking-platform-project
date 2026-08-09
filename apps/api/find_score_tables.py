import json
import re
import subprocess
import sys
import os

# Load the OpenAPI spec
spec_path = 'openapi.json'
if not os.path.exists(spec_path):
    print(f"Error: {spec_path} not found")
    sys.exit(1)

with open(spec_path, 'r') as f:
    spec = json.load(f)

# Get service role key from .env.local
env_file = '.env.local'
SERVICE_ROLE_KEY = None
try:
    with open(env_file, 'r') as f:
        for line in f:
            if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                SERVICE_ROLE_KEY = line.strip().split('=', 1)[1]
                break
except Exception as e:
    print(f"Error reading {env_file}: {e}")
    sys.exit(1)

if not SERVICE_ROLE_KEY:
    print("Could not get SUPABASE_SERVICE_ROLE_KEY from .env.local")
    sys.exit(1)

print(f"Using service role key: {SERVICE_ROLE_KEY[:10]}...")

# Base URL
base_url = "https://mojwbpjwrhfohalfdred.supabase.co/rest/v1"

# Keywords to look for in column names
score_keywords = ['score', 'overall', 'confidence', 'rating', 'level', 'tier', 'badge', 'maturity', 'completeness', 'rank']

def contains_score_keyword(s):
    s_lower = s.lower()
    return any(kw in s_lower for kw in score_keywords)

# We'll store results
results = []

# Helper to resolve a $ref
def resolve_ref(ref):
    # ref is like "#/definitions/instrument_runs"
    if not ref.startswith('#/'):
        return None
    parts = ref.split('/')
    # parts[0] is empty, parts[1] is 'definitions', parts[2] is the definition name
    if len(parts) < 3 or parts[1] != 'definitions':
        return None
    def_name = parts[2]
    return spec.get('definitions', {}).get(def_name)

# Extract table names from paths
tables = []
for path, path_spec in spec.get('paths', {}).items():
    if path == '/' or path.startswith('/?'):
        continue
    # Remove leading slash and any query parameters
    table = path.lstrip('/').split('?')[0]
    tables.append(table)

print(f"Found {len(tables)} tables in the API")

# For each table, try to get its schema from the path's get operation
for table in tables:
    # Try to get the path spec with and without leading slash
    path_spec = None
    if table in spec.get('paths', {}):
        path_spec = spec['paths'][table]
    elif f"/{table}" in spec.get('paths', {}):
        path_spec = spec['paths'][f"/{table}"]
    else:
        # If we can't find the path, skip
        continue

    # Look for a get operation
    get_op = path_spec.get('get')
    if not get_op:
        # Try post? Actually, we just need the schema of the table, which should be in the get response.
        continue

    # Get the 200 response schema
    responses = get_op.get('responses', {})
    response_200 = responses.get('200')
    if not response_200:
        continue

    schema = response_200.get('schema')
    if not schema:
        continue

    # The schema might be an array of items, or a single object.
    # We are interested in the items schema if it's an array.
    if schema.get('type') == 'array':
        items_schema = schema.get('items', {})
        # items_schema might have a $ref
        if '$ref' in items_schema:
            ref = items_schema['$ref']
            table_schema = resolve_ref(ref)
        else:
            table_schema = items_schema
    else:
        # Maybe it's a direct reference?
        if '$ref' in schema:
            ref = schema['$ref']
            table_schema = resolve_ref(ref)
        else:
            table_schema = schema

    if not table_schema:
        # Fallback: maybe the schema is directly in the definition with the table name?
        # Try to look up in definitions by table name (singular/plural)
        # We'll skip for now.
        continue

    # Get properties
    properties = table_schema.get('properties', {})
    if not properties:
        continue

    # Find score-like columns
    score_columns = [col for col in properties.keys() if contains_score_keyword(col)]
    if not score_columns:
        continue

    print(f"Processing table: {table} with score columns: {score_columns}")

    # Build curl commands
    table_url = f"{base_url}/{table}"
    headers = [
        f"-H \"apikey: {SERVICE_ROLE_KEY}\"",
        f"-H \"Authorization: Bearer {SERVICE_ROLE_KEY}\"",
        "-H \"Accept: application/json\""
    ]
    header_str = " ".join(headers)

    # Get count using prefer: count=exact and limit=1 to get headers
    count_cmd = f'curl -s -I {header_str} -H "Prefer: count=exact" "{table_url}?select=*&limit=1"'
    try:
        count_result = subprocess.check_output(count_cmd, shell=True, stderr=subprocess.STDOUT, timeout=10)
        count_output = count_result.decode('utf-8')
        # Parse Content-Range header for count
        count = None
        for line in count_output.split('\n'):
            if line.startswith('Content-Range:'):
                # Format: bytes 0-0/* or items 0-0/* 
                # Actually PostgREST returns: */total or 0-0/*? Let's see.
                # We'll extract the number after the slash
                match = re.search(r'/\s*(\d+)', line)
                if match:
                    count = int(match.group(1))
                    break
        if count is None:
            # Fallback: try to get count via select=count
            count_cmd2 = f'curl -s {header_str} "{table_url}?select=count"'
            count_result2 = subprocess.check_output(count_cmd2, shell=True, stderr=subprocess.STDOUT, timeout=10)
            count_output2 = count_result2.decode('utf-8')
            try:
                # The response might be JSON array with one object containing count
                data = json.loads(count_output2)
                if isinstance(data, list) and len(data) > 0 and 'count' in data[0]:
                    count = data[0]['count']
                elif isinstance(data, dict) and 'count' in data:
                    count = data['count']
            except Exception as e:
                print(f"Error parsing count for {table}: {e}")
                count = "unknown"
    except subprocess.CalledProcessError as e:
        print(f"Error getting count for {table}: {e.output.decode()}")
        count = "error"
    except Exception as e:
        print(f"Unexpected error getting count for {table}: {e}")
        count = "error"

    # Get sample rows (limit=5)
    sample_cmd = f'curl -s {header_str} "{table_url}?select=*&limit=5"'
    try:
        sample_result = subprocess.check_output(sample_cmd, shell=True, stderr=subprocess.STDOUT, timeout=10)
        sample_output = sample_result.decode('utf-8')
        sample_rows = []
        try:
            sample_data = json.loads(sample_output)
            if isinstance(sample_data, list):
                sample_rows = sample_data
        except Exception as e:
            print(f"Error parsing sample for {table}: {e}")
            sample_rows = []
    except subprocess.CalledProcessError as e:
        print(f"Error getting sample for {table}: {e.output.decode()}")
        sample_rows = []
    except Exception as e:
        print(f"Unexpected error getting sample for {table}: {e}")
        sample_rows = []

    # Extract sample values for score columns
    sample_values = {}
    if sample_rows:
        for col in score_columns:
            values = [row.get(col) for row in sample_rows if col in row]
            # Filter out None
            values = [v for v in values if v is not None]
            if values:
                sample_values[col] = values[:3]  # first 3 non-null values

    # Determine if aggregate or factual
    # Heuristic: check for organization_id and whether score columns look aggregated
    is_aggregate = False
    reasoning = []
    has_org_id = 'organization_id' in properties
    if has_org_id:
        reasoning.append("has organization_id")
        # Check if score columns contain words like average, total, sum, ratio, percentage
        agg_indicators = ['average', 'avg', 'total', 'sum', 'ratio', 'percentage', 'pct']
        for col in score_columns:
            col_lower = col.lower()
            if any(ind in col_lower for ind in agg_indicators):
                is_aggregate = True
                reasoning.append(f"column '{col}' suggests aggregation")
                break
        # If not yet determined, check if there are multiple rows per organization in sample? Hard without more data.
        # We'll also consider tables that have a time period column (like year, month, date) and organization_id as aggregate
        time_indicators = ['year', 'month', 'date', 'period', 'time', 'day']
        for col in properties.keys():
            col_lower = col.lower()
            if any(ind in col_lower for ind in time_indicators):
                if has_org_id:
                    is_aggregate = True
                    reasoning.append(f"has time column '{col}' and organization_id")
                    break
    else:
        reasoning.append("no organization_id")

    # If still not aggregate, check if table name suggests aggregation
    agg_table_indicators = ['organization_', 'summary', 'aggregate', 'stats', 'metrics', 'kpi']
    table_lower = table.lower()
    if any(ind in table_lower for ind in agg_table_indicators):
        is_aggregate = True
        reasoning.append("table name suggests aggregation")

    # Default to factual if not marked aggregate
    if not is_aggregate:
        reasoning.append("classified as factual (per-entity)")

    classification = "aggregate" if is_aggregate else "factual"

    results.append({
        'table': table,
        'score_columns': score_columns,
        'row_count': count,
        'sample_values': sample_values,
        'classification': classification,
        'reasoning': '; '.join(reasoning)
    })

# Print results
print("\n=== Score Tables Inventory ===\n")
for r in results:
    print(f"Table: {r['table']}")
    print(f"  Score columns: {', '.join(r['score_columns'])}")
    print(f"  Row count: {r['row_count']}")
    print(f"  Classification: {r['classification']} ({r['reasoning']})")
    if r['sample_values']:
        print("  Sample values:")
        for col, vals in r['sample_values'].items():
            print(f"    {col}: {vals}")
    else:
        print("  Sample values: (none or could not fetch)")
    print()

print(f"Total score tables found: {len(results)}")