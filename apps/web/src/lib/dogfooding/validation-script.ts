// ==========================================================================
// MVP Sprint 7 — First Customer Validation: Vilo Research
// ==========================================================================
// Marco de validación para mañana.
// Objetivo: Vilo Research completa el onboarding y obtenemos feedback real.
// ==========================================================================

export const VALIDATION_SCRIPT = {
  institution: 'Vilo Research Institute',
  date: '2026-07-07',
  facilitator: 'Kadarn Team',
  participant: 'Vilo Research Administrator',

  // ========================================================================
  // PRE-SESSION
  // ========================================================================
  preSession: {
    goal: 'Vilo Research construye su Institution Passport en Kadarn sin entrenamiento previo.',
    setup: [
      'Ambiente listo — onboarding accesible en /onboarding',
      'Dataset Vilo cargado como punto de partida (opcional: empezar desde cero)',
      'Grabación de pantalla activa (con permiso)',
      'No explicar el producto — solo decir: "Queremos que construyas el perfil de Vilo Research en esta plataforma."',
    ],
    dontDo: [
      'No guiar — observar',
      'No justificar decisiones de diseño — anotar la reacción',
      'No interrumpir — solo preguntar "¿qué esperabas que pasara?" si se traba',
    ],
  },

  // ========================================================================
  // OBSERVATION CHECKPOINTS
  // ========================================================================
  checkpoints: [
    {
      step: 'Landing / Welcome',
      observe: [
        '¿Entiende qué es Kadarn en la primera pantalla?',
        '¿Hace clic en "Start" sin dudar?',
        '¿Lee la lista de lo que obtendrá?',
      ],
      timeTarget: '< 2 minutos',
    },
    {
      step: 'Organization',
      observe: [
        '¿Completa tipo de institución sin ayuda?',
        '¿Entiende las áreas terapéuticas?',
        '¿Se saltea preguntas o las completa todas?',
        '¿Lee los textos de ayuda?',
      ],
      timeTarget: '< 10 minutos',
    },
    {
      step: 'People',
      observe: [
        '¿Agrega al PI correctamente?',
        '¿Entiende la diferencia entre roles y certificaciones?',
        '¿El contador de equipo refleja su realidad?',
      ],
      timeTarget: '< 8 minutos',
    },
    {
      step: 'Infrastructure',
      observe: [
        '¿Las gates condicionales funcionan? (lab: sí → muestra preguntas)',
        '¿Entiende qué especímenes seleccionar?',
        '¿La sección de Research Experience aparece correctamente?',
        '¿La sección de Quality aparece correctamente?',
      ],
      timeTarget: '< 15 minutos',
    },
    {
      step: 'Documents',
      observe: [
        '¿Sabe qué documentos subir?',
        '¿Entiende por qué cada documento es importante?',
        '¿La lista de críticos vs. recomendados es clara?',
      ],
      timeTarget: '< 5 minutos',
    },
    {
      step: 'Capabilities (derived)',
      observe: [
        '¿Entiende que esto es derivado, no preguntado?',
        '¿Las capacidades mostradas coinciden con lo que Vilo realmente hace?',
        '¿Falta alguna capacidad importante?',
        '¿Sobra alguna?',
      ],
      timeTarget: '< 2 minutos',
    },
    {
      step: 'Readiness (derived)',
      observe: [
        '¿El score general le parece justo?',
        '¿Las dimensiones reflejan la realidad?',
        '¿Los programas elegibles tienen sentido?',
      ],
      timeTarget: '< 2 minutos',
    },
    {
      step: 'Passport',
      observe: [
        '¿Las 5 secciones son claras?',
        '¿El Passport representa correctamente a Vilo?',
        '¿Haría clic en "Share Passport"?',
        '¿Exportaría el PDF?',
      ],
      timeTarget: '< 3 minutos',
    },
  ],

  // ========================================================================
  // POST-SESSION QUESTIONS (the ones that matter)
  // ========================================================================
  validationQuestions: [
    {
      id: 'Q1',
      question: '¿Entendiste qué es Kadarn?',
      targetAnswer: 'Sí, sin explicaciones adicionales.',
      notes: '',
    },
    {
      id: 'Q2',
      question: '¿El proceso te pareció natural o fue un formulario?',
      targetAnswer: 'Natural — sentí que estaba contando sobre mi institución.',
      notes: '',
    },
    {
      id: 'Q3',
      question: '¿El Passport representa correctamente a Vilo Research?',
      targetAnswer: 'Sí, refleja quiénes somos y qué podemos hacer.',
      notes: '',
    },
    {
      id: 'Q4',
      question: '¿Hay algo importante de Vilo que el Passport NO capturó?',
      targetAnswer: 'Idealmente: nada crítico. Anotar todo lo que falte.',
      notes: '',
    },
    {
      id: 'Q5',
      question: '¿Compartirías este Passport con un sponsor o CRO?',
      targetAnswer: 'Sí — o "Sí, después de ajustar X."',
      notes: '',
    },
    {
      id: 'Q6',
      question: '¿Qué fue lo más confuso o frustrante?',
      targetAnswer: 'Anotar textual. Esto es oro para el refinement.',
      notes: '',
    },
    {
      id: 'Q7',
      question: '¿Qué fue lo que más valor te dio?',
      targetAnswer: 'Anotar textual. Esto es lo que hay que proteger.',
      notes: '',
    },
    {
      id: 'Q8',
      question: '¿Volverías a usar Kadarn para mantener actualizado tu perfil?',
      targetAnswer: 'Sí.',
      notes: '',
    },
  ],

  // ========================================================================
  // THE GOLDEN QUOTE
  // ========================================================================
  goldenQuote: {
    target: '"Nunca habíamos tenido una visión tan completa y organizada de quiénes somos, qué podemos demostrar y qué necesitamos mejorar."',
    actual: '',
    achieved: false,
  },

  // ========================================================================
  // SUCCESS CRITERIA
  // ========================================================================
  successCriteria: [
    { criterion: 'Time to First Passport < 45 minutos', met: false, actual: null },
    { criterion: 'Entendió Kadarn sin explicaciones', met: false, actual: null },
    { criterion: 'El Passport refleja correctamente a Vilo', met: false, actual: null },
    { criterion: 'Compartiría el Passport con un sponsor', met: false, actual: null },
    { criterion: 'Volvería a usar la plataforma', met: false, actual: null },
    { criterion: 'La golden quote aparece espontáneamente (o cerca)', met: false, actual: null },
  ],

  // ========================================================================
  // KNOWN ISSUES TO WATCH (from Sprint 5 dogfooding)
  // ========================================================================
  knownIssues: [
    'FR-9: Sin botón "Not Applicable" — ¿menciona que algo no aplica?',
    'FR-3: PI therapeutic areas limitadas por checkbox — ¿quiere agregar algo que no está?',
    'FR-10: Geographic reach sin granularidad de estados — ¿menciona estados específicos?',
    'FR-1: Interview budget — ¿siente que falta capturar algo importante?',
  ],

  // ========================================================================
  // NEXT-DAY ACTIONS
  // ========================================================================
  afterSession: [
    'Clasificar cada fricción nueva (UX / KnowledgeModel / BusinessRule / Content / Validation / Bug)',
    'Comparar contra las 13 fricciones del Sprint 5 — ¿cuáles se confirmaron? ¿cuáles nuevas aparecieron?',
    'Si ≥4 de 6 success criteria se cumplen → MVP validado',
    'Si la golden quote aparece → MVP validado con distinción',
    'Planificar Sprint 6.5 (refinement post-validation) basado en feedback real',
  ],
}
