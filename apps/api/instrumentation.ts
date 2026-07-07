export async function register() {

  if (process.env.NEXT_RUNTIME === 'nodejs') {

    const { assertConfig } = await import('./src/lib/config')

    assertConfig()

    const { bootstrapInstrumentation } = await import('./src/lib/instrumentation-bootstrap')

    bootstrapInstrumentation()

  }

}

