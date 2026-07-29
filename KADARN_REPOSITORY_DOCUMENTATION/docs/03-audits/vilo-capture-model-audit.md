# Auditoría profunda del modelo de captura de Kadarn para Vilo Research Group

## Veredicto ejecutivo

Mi conclusión, con base en lo que pegaste y contrastándolo con estándares regulatorios y operativos de investigación clínica, es esta: **Kadarn está bien encaminado en la arquitectura general, pero hoy no está calibrando bien la frontera entre dato esencial, dato condicional y dato derivable**. La estructura de cinco bloques —Organization, People, Infrastructure, Documents, Memory— sí refleja dimensiones reales que patrocinadores y marcos GCP revisan: calificación del investigador, recursos, instalaciones, IRB/IEC, laboratorios, documentación esencial y sistemas de calidad. FDA exige que el patrocinador seleccione investigadores calificados por formación y experiencia y obtenga, antes de iniciar, información sobre investigador, instalaciones, laboratorio, IRB, CV y divulgaciones financieras; ICH E6(R3) además exige evidencia de calificaciones, recursos suficientes, archivos esenciales y sistemas computarizados validados. citeturn5view1turn34view0turn34view1turn35view0turn34view4

Dicho eso, **la implementación actual no está suficientemente afinada para producir un “passport” sponsor-grade con baja fricción**. En el snapshot que compartiste, el sistema deriva una capacidad “Strong” y una “Research Readiness” de 100/100 prácticamente a partir de autoafirmaciones de tipo institucional y research focus, mientras simultáneamente muestra ausencia de evidencia documental crítica. Eso es una señal clara de **sobreinferir desde datos débiles** y de **mezclar “desconocido” con “ausente”**. Bajo ICH E6(R3), los registros esenciales sirven precisamente para evaluar el cumplimiento GCP, la confiabilidad de resultados y la idoneidad operativa del sitio; no basta con autodescripción para sostener una afirmación fuerte. citeturn35view0turn32view3

En términos de tus cuatro preguntas, mi respuesta es: **están parcialmente bien colectados; no son todavía suficientes; son útiles pero con redundancias y varios campos mal modelados; y sí se pueden consolidar de forma mucho más limpia, con un modelo canónico entidad-evidencia y captura condicional por módulos**. Esa consolidación reduciría fricción, mejoraría precisión y evitaría castigar a la institución por capacidades que no aplica o que aún no fueron declaradas. citeturn34view1turn35view0turn10view1turn37view0

## Lo que Kadarn está haciendo bien

Hay varias decisiones de diseño que, conceptualmente, son correctas.

Primero, **separar personas, infraestructura, documentos y memoria** es una buena idea. FDA y ICH tratan estos elementos como capas distintas: el investigador y subinvestigadores deben estar calificados; el sitio debe tener recursos suficientes; los laboratorios e IRB deben estar identificados; y los registros esenciales deben conservarse en repositorios trazables y recuperables. Esa lógica coincide con la noción de un “institutional profile” respaldado por evidencia. citeturn5view1turn34view0turn34view1turn35view0

Segundo, **derivar cobertura institucional desde los registros individuales del staff** es correcto. La pantalla de “Research Certifications” dice que no habrá entrada manual a nivel institución y que se derivará desde cada staff member. Esa decisión está alineada con NIH e ICH: la formación GCP es una característica de las personas y su documentación debe conservarse; no tiene mucho sentido pedirla de nuevo como campo agregado manual, salvo como output derivado. NIH espera que investigadores y staff involucrado en diseño, conducción, supervisión o gestión de ensayos estén entrenados en GCP y mantengan documentación de esa formación. citeturn32view0turn32view1

Tercero, **capturar infraestructura por location en vez de a nivel institución** también está bien. ICH pide recursos y facilities adecuadas para el ensayo, y FDA 1572 pide identificar las instalaciones donde se realizará la investigación y los laboratorios usados. Eso significa que la unidad lógica real de operación no es solo la entidad legal, sino el sitio operativo concreto. citeturn5view1turn34view1

Cuarto, **tener una capa documental y un output derivado de readiness** también es acertado. ICH E6(R3) es explícita en que los registros esenciales permiten evaluar la conducción del ensayo, la confiabilidad de los resultados y la supervisión de sponsor e investigator, y que deben mantenerse de forma versionada, identificable y recuperable. En otras palabras: un “evidence layer” no es un lujo, es el centro de la trazabilidad. citeturn35view0turn34view4

## Dónde la captura actual falla o queda corta

La falla principal no es tanto de categorías, sino de **modelado de estados, jerarquía y reglas de derivación**.

### Confunde ausencia de dato con ausencia de capacidad

En tu snapshot, el sistema concluye “No laboratory documented”, “No biospecimen operations” y penaliza backup power y shared research space, aunque lo que se observa en el flujo es que varios campos están simplemente pendientes o no respondidos. Eso es un error de lógica de producto: **“unknown”, “not collected yet”, “not applicable” y “no” no son la misma cosa**. ICH habla de evaluación basada en registros relevantes y proporcionales al riesgo; si no hay dato, lo correcto es degradar confianza, no asumir que la capacidad no existe. citeturn35view0turn34view1

### IRB Approval está mal modelado como documento institucional universal

Éste es uno de los puntos más importantes. En ICH E6(R3), antes de iniciar un ensayo el investigador/institución debe tener aprobación favorable **para el protocolo del ensayo**, materiales de consentimiento y reclutamiento. FDA 21 CFR 312.53 también pide al sponsor identificar el IRB responsable de la revisión y aprobación del estudio o estudios. Eso significa que la “IRB approval” es, en esencia, **trial-specific**, no un atributo fijo universal de la institución como lo sería un business license. Para un perfil institucional, lo correcto sería pedir: relación IRB/IEC, tipo de IRB, central vs local, reliance arrangements si aplican, y ejemplos/redactados de aprobaciones recientes; no tratar “IRB approval” como un único documento crítico institucional siempre existente. citeturn37view0turn37view1turn5view1

### CLIA está modelado como crítico universal cuando debería ser condicional

CMS establece que CLIA regula el testing de laboratorio realizado en humanos en EE. UU., **excepto research testing**. Por eso, pedir “CLIA Certificate” como documento crítico base para toda institución de investigación es demasiado duro si el sitio no opera un laboratorio clínico, no reporta resultados clínicos, o solo hace recolección/envío/research-only processing. CLIA es totalmente relevante si el sitio declara pruebas humanas cubiertas por CLIA; pero si no, debe pasar a un carril condicional de laboratorio/IVD, no al core universal. citeturn10view1turn10view2

### El motor de capabilities y readiness está sobrepremiando autoafirmaciones

El capability “Clinical Research Operations — Strong” se deriva en tu ejemplo con base en “Institution type” y “Research focus”. Eso es demasiado poco. ICH exige evidencia de calificaciones, personal suficiente, facilities adecuadas, registros fuente, repositorios de essential records y, cuando aplica, sistemas validados. FDA además pone el foco en derechos, seguridad y bienestar de sujetos, y en evidencia robusta. Por eso, una capacidad “Strong” debería requerir al menos **dos clases de evidencia independientes**, por ejemplo: estructura organizacional + staff calificado + evidencia documental reciente. Lo actual crea una ilusión de madurez sin suficiente soporte. citeturn5view0turn34view0turn34view1turn35view0turn32view3

### Faltan varios datos sponsor-relevant de alta señal

Aun si Kadarn ya pide bastante, para un dossier realmente útil frente a sponsor/CRO todavía faltan varios elementos de alta señal operativa. FDA 1572 deja claro que son relevantes, entre otros, instalaciones, laboratorios, IRB, subinvestigadores, CV y financial disclosure; ICH añade entrenamiento, delegación, source records, fit-for-purpose laboratory activities y sistemas computarizados validados. A la luz de eso, el snapshot todavía se queda corto en varios frentes: relación IRB exacta, listado real de subinvestigadores, CV/licensure verificable, fit-for-purpose de pruebas/lab, evidencia del sistema de calidad, data systems, y gobernanza documental. citeturn5view1turn34view2turn35view0turn34view4

Eso no significa que haya que pedirlo todo en el primer paso. Significa que el diseño actual aún no distingue bien entre **core intake**, **conditional expansion** y **evidence backfill**.

## Qué es útil y necesario, y qué es redundante o debería ser condicional

La mejor manera de reducir fricción aquí es separar el universo de datos en tres capas: **esencial ahora**, **condicional según capacidades declaradas**, y **derivable después**.

### Lo esencial ahora

Para un “fast sponsor-facing baseline”, sí conviene pedir desde el inicio: identidad legal básica, nombre operativo, tipo de institución, ubicación o locations, contacto principal, research leadership real, roster mínimo del equipo activo, áreas terapéuticas de alto nivel, foco operativo, y un set reducido de evidencia base. Esto sí está alineado con el hecho de que sponsor e investigator selection dependen de experiencia, recursos y sitio operativo identificable. citeturn5view1turn34view0turn34view1

### Lo condicional

Varios elementos de la taxonomía documental y de readiness no deberían dispararse para todos los sitios.

| Tema | Estado recomendado | Razón |
|---|---|---|
| CLIA | Condicional | Solo cuando el sitio declara testing humano regulado o capacidad lab/IVD relevante |
| IATA / shipping certification | Condicional | Solo si declara shipping de biospecimens o dangerous goods |
| Equipment qualification records | Condicional | Solo si declara equipos regulados/críticos usados en trial procedures o lab |
| Pharmacy docs | Condicional | Solo si maneja IMP/IP en sitio |
| Early phase / overnight capacity | Condicional | Solo si el sitio busca Phase I / first-in-human / inpatient capability |
| IRB approval letters | Condicional y trial-specific | Deben modelarse por estudio o como evidencia de operación previa, no como documento institucional único |

La base normativa para esta modularidad está en ICH E6(R3): los registros esenciales dependen del diseño y conducción del ensayo, deben ser proporcionales y algunos registros se relacionan con instalaciones, procesos, sistemas o múltiples ensayos; además, actividades de laboratorio deben ser fit for purpose y los sistemas deben estar correctamente documentados y validados. citeturn35view0turn34view4

### Lo redundante o mal duplicado

Aquí veo cuatro redundancias claras en el flujo que compartiste.

La primera es **Primary Research Leadership** separado del roster del equipo. Si ya existe una tarjeta de persona con roles, basta con marcar una o más personas como “primary research lead”, “primary sponsor contact” o “regulatory contact”. Pedirlo aparte genera duplicidad y riesgo de inconsistencia.

La segunda es la zona legal: **Business Registration, Operating License, Certificate of Incorporation, Tax Registration, Certificate of Good Standing**. Todos son útiles en algunos contextos, pero no deberían comportarse como cinco preguntas independientes “de primer día” para todos los países y tipos de entidad. Deben consolidarse dentro de una entidad “Legal standing” con subtipo documental, jurisdicción, número, fecha efectiva y expiración cuando aplique.

La tercera es seguros: **Business Insurance, Professional Liability Insurance, General Liability Insurance, Workers Compensation**. Toda esa familia debería entrar bajo un objeto común de “Insurance coverage”, con tipos de póliza y vigencias, no como campos separados desde el inicio.

La cuarta es experiencia: pedir “completed studies”, “current studies”, “research history”, “institutional memory” y luego derivar capabilities puede crear doble captura de lo mismo. ICH ya contempla que algunos registros pueden vivir fuera del repositorio trial-specific y que un structured content list puede usarse para identificar registros esenciales; por eso conviene tener una base única de study history y evidencias, no varias superficies que repiten historia operativa. citeturn35view0

## Cómo consolidarlo para reducir fricción

La forma correcta de consolidar esto no es quitar bloques, sino **normalizar la información en un modelo canónico único** y luego hacer que Kadarn pregunte una vez y reutilice muchas veces.

### Modelo canónico recomendado

El modelo debería ser algo así:

| Entidad canónica | Qué guarda | Qué deriva |
|---|---|---|
| Institution | identidad legal, operating name, mission, institution type, tax/legal metadata | Passport “Who we are”, base governance |
| Location | dirección, facility type, rooms, lab/pharmacy/imaging, backup power, storage, shipping, biospecimen workflow | Infrastructure summary, program fit |
| Person | nombre, credenciales, rol, licencias, formación, terapéuticas, idiomas, asignación por location | Org chart, certification coverage, therapeutic depth |
| Study Experience | estudios previos/actuales, fases, sponsors, enrollment, performance | capability strength, readiness, memory |
| Quality & Oversight | IRB model, SOP/QMS, audits/inspections, CAPA, training governance | regulatory/documentation readiness |
| Asset/System | equipos, freezers, monitoring, EHR/EDC, eSource/eConsent, validation | laboratory/operational/data readiness |
| Evidence Document | tipo, jurisdicción, vigencia, linked entities, extracted metadata, confidence | all derived outputs, alerts, expirations |

Este enfoque se alinea muy bien con ICH E6(R3), que habla de records esenciales en repositorios mantenidos por sponsor e investigator/institution, con localización trazable, versionado, recuperación, validación de sistemas y documentos que pueden ser trial-specific o comunes a varios ensayos, instalaciones o sistemas. citeturn35view0turn34view4

### Lógica de entrevista recomendada

En vez de un flujo lineal tan pesado, yo lo rediseñaría en tres pasos.

**Paso uno: Baseline Passport.**  
Un intake de 10 a 15 minutos para identity, leadership, locations, roster mínimo y un puñado de high-signal docs. Esto permite generar un passport preliminar sin sobrecastigar campos aún no aportados.

**Paso dos: Conditional expansion.**  
Si el usuario marca lab, se abre módulo CLIA/lab/IVD. Si marca biospecimen shipping, se abre módulo cadena de custodia + shipping. Si marca pharmacy, se abre módulo IMP/IP. Si marca early phase, se abre módulo overnight/emergency/resuscitation. Esto responde al principio de relevancia y proporcionalidad documental de ICH. citeturn35view0

**Paso tres: Evidence backfill.**  
OCR y extracción automática desde documentos para poblar equipo, pólizas, fechas, licencias, direcciones, versiones y expiraciones. Esto reduce fricción y mejora exactitud; además, permite que un mismo documento alimente múltiples outputs sin recaptura manual.

### Estados de dato que Kadarn debe distinguir

Aquí Kadarn necesita una corrección estructural. Cada campo importante debería tener cinco estados:

| Estado | Significado |
|---|---|
| Verified | respaldado por documento válido |
| Declared | autodeclarado, sin evidencia aún |
| Unknown | no capturado todavía |
| Not applicable | no corresponde al modelo operativo |
| Expired / outdated | evidencia existente pero no vigente |

Esa distinción es crítica porque ICH y FDA operan sobre trazabilidad, cumplimiento y evidencia; si Kadarn sigue tratando “unknown” como “no”, va a generar readiness engañoso y recomendaciones equivocadas. citeturn35view0turn32view3

## Dataset mínimo recomendado para Vilo

Si el objetivo es bajar fricción sin perder valor sponsor-facing, yo propondría para Vilo un **MVDS** —minimum viable data set— como el siguiente.

### Núcleo inicial

| Dominio | Campo mínimo | Debe pedirse ahora |
|---|---|---|
| Institution | legal name, DBA, institution type, mission, EIN/tax id opcional según país, headquarters/location count | Sí |
| Leadership | primary research lead, primary sponsor contact, regulatory contact | Sí |
| Team | roster mínimo con PI, CRC, subinvestigators clave, research nurse si existe | Sí |
| Site footprint | address/location, facility type, dedicated research space sí/no/unknown | Sí |
| Experience | current studies, completed studies, phases, top therapeutic areas | Sí |
| Evidence | business/license evidence, PI medical license, GCP docs, org chart opcional pero útil | Sí |

### Módulos condicionales

| Módulo | Trigger |
|---|---|
| IRB/IEC | cualquier investigación con humanos; pero preguntar relación IRB, no “IRB approval” genérico |
| Laboratory / IVD | si declara lab, testing, IVD, processing beyond simple collection |
| Biospecimen | si recoge/procesa/almacena/envía muestras |
| Pharmacy / IP | si maneja investigational product en sitio |
| Early phase | si quiere Phase I / overnight / infusion-intensive / FIH |
| Digital operations | si usa eSource, EHR extraction, remote monitoring, eConsent, ePRO |

### Evidencia a pedir primero

Los primeros documentos deberían ser pocos y de alta señal. Para una institución como la que describes, priorizaría: prueba de entidad legal/operating authority, licencia médica del PI, GCP del personal activo, documento que acredite IRB model o aprobación reciente si existe un estudio activo, un documento de quality system si ya existe, y evidencia de cada capability que se quiera exhibir comercialmente. ICH considera esenciales los documentos regulatorios/IRB, los que prueban calificación de sponsor e investigator staff, los acuerdos/seguros, la adecuación de laboratorio y la validación de sistemas cuando aplica. citeturn35view0turn34view0turn34view4

## Juicio específico sobre el snapshot actual de Vilo

Con base exclusivamente en el material que pegaste, **hoy la información no está suficientemente bien consolidada para presentar a Vilo como un sitio “strong” frente a un sponsor sin matices importantes**.

Veo al menos seis problemas concretos en ese snapshot.

El primero es que el Passport muestra **“Primary PI: Not specified”**, “Roles: Not specified” y “Locations: Not specified”, mientras al mismo tiempo muestra una institución operativa y readiness derivado. Eso indica que el perfil central todavía tiene huecos estructurales de identidad operativa.

El segundo es que el capability “Clinical Research Operations” aparece como **Strong** con soporte mínimo. Eso es optimista en exceso comparado con los estándares de cualificación de investigator/institution, recursos, facilities y registros esenciales que exigen FDA e ICH. citeturn5view1turn34view0turn34view1turn35view0

El tercero es que la Documentation Readiness penaliza documentos como CLIA, IATA y equipment qualification records sin que el snapshot pruebe todavía que el modelo operativo de Vilo realmente active todos esos requirements. CMS deja claro que CLIA se refiere a testing de laboratorio en humanos, excepto research testing; por tanto, si Vilo no ha declarado testing humano cubierto por CLIA, no deberías tratar CLIA como missing core base. citeturn10view1turn10view2

El cuarto es que “IRB Approval” aparece como documento crítico institucional. Para una visión sponsor-facing general, eso debería reconvertirse a **IRB relationship model + evidence of review pathway**, porque la aprobación IRB real es por protocolo/estudio. citeturn37view0turn5view1

El quinto es que el snapshot castiga “power failure risks specimen integrity” y “biospecimen readiness 0/100” cuando la infraestructura aparece mayormente pendiente. Eso sugiere que Kadarn está cerrando inferencias en negativo desde silencio del usuario, algo que conviene corregir.

El sexto es que la capa “Memory” se está pidiendo demasiado pronto. Para reducir fricción, la memoria institucional debería poblarse casi sola desde fechas de constitución, fechas de licencia, estudios previos, contrataciones, inspecciones y documentos versionados. ICH incluso prevé structured content lists, version history, record location y repositorios de trial records, lo que hace muy natural una memoria más automática que manual. citeturn35view0

Mi evaluación final para Vilo sería esta:

| Pregunta | Respuesta |
|---|---|
| ¿Están bien colectados? | **Parcialmente**. La estructura es buena, pero el modelado de estados y derivaciones aún no |
| ¿Son suficientes? | **No todavía** para un perfil sponsor-grade robusto |
| ¿Son útiles, necesarios y no redundantes? | **Mixto**. Hay mucho valor, pero también duplicación y varios “críticos” mal universalizados |
| ¿Cómo consolidarlos? | **Con captura una sola vez por entidad, branching condicional y evidencias reutilizables** |

Si tu objetivo es reducir fricción de verdad, mi recomendación operativa sería: **convertir Kadarn de un cuestionario largo a un grafo de evidencia con entrevistas progresivas**. Pide poco al inicio, deriva más desde documentos, activa módulos solo cuando haya señal de que aplican, y no permitas que una capability salga como “Strong” ni que una readiness salga alta cuando solo existe self-report sin respaldo suficiente. Esa es la línea que mejor encaja con FDA, NIH, CMS e ICH, y también la que haría más defendible el Passport ante un sponsor o partner serio. citeturn32view3turn32view1turn10view2turn35view0turn34view0