# Validación arquitectónica del Publication and Delivery Layer para Kadarn

## Veredicto ejecutivo

La tesis central del plan es **correcta y valiosa**: Kadarn no debería resolver este problema como un simple “Sponsor Portal” ni como una colección de pantallas, sino como una **capa explícita de publicación y entrega** que transforme evidencia y conocimiento en productos consumibles por distintos actores. Esa dirección está bien alineada con la práctica regulatoria moderna, porque ICH E6(R3) separa con claridad los repositorios y responsabilidades del sponsor y del investigator/institution, exige trazabilidad, control de versiones, búsqueda/recuperación y conservación de registros esenciales, y admite que ciertos registros se compartan mediante portales siempre que cada parte conserve y retenga su propio corpus documental. citeturn3view4turn3view5

También es correcto el principio de fondo de tu propuesta: **producir conocimiento** y **publicarlo/controlarlo** son capacidades distintas. Esa separación no solo tiene sentido de producto; también tiene fundamento regulatorio y operativo. ICH E6(R3) exige que los registros esenciales se mantengan en o referenciados desde repositorios del sponsor y del investigator/institution, que las alteraciones sean trazables y que existan mecanismos de identificación, versionado, búsqueda y recuperación. EMA, además, enfatiza que el sponsor/CRO no debe tener acceso libre al investigator TMF y que el acceso remoto a documentos sensibles debe ser limitado, aprobado, autenticado, trazable y temporal. citeturn3view4turn2view1turn7view0

Mi juicio ejecutivo, por tanto, es este: **sí conviene crear un nuevo dominio arquitectónico de primer nivel**, pero el plan actual necesita varios ajustes para quedar realmente robusto. En particular, recomiendo **corregir el alcance del PDL**, **mover algunas responsabilidades a servicios transversales**, **reordenar el roadmap**, y **cambiar la narrativa de “Document Vault reemplaza al ZIP” por una arquitectura donde el Vault gobierna los documentos y los exports siguen existiendo como salidas controladas**. citeturn6view0turn6view2turn3view4

No pude validar contra el “Master Work Plan”, KRM-RAO u otros documentos internos referidos en la solicitud porque en esta conversación no había archivos recuperables ni fuentes internas consultables disponibles para inspección directa. Por eso, la validación que sigue es **arquitectónica y regulatoria**, apoyada en estándares y guías externas relevantes, y no una verificación documental línea por línea contra esos artefactos internos.

## Lo que el plan acierta y queda fuertemente validado

El mayor acierto del plan es reconocer que sponsors, CROs, vendors, auditores y sitios **no consumen el mismo producto**. Esa idea coincide con cómo la industria ha intentado reducir carga administrativa y duplicación documental. TransCelerate describe precisamente ese problema: los sitios suelen completar cuestionarios, forms y trainings duplicados por sponsor y por estudio, y su iniciativa de Site Qualification and Training busca simplificar ese intercambio con formularios estandarizados, CV templates, facility profile forms y reconocimiento mutuo de GCP training. En otras palabras, el mercado ya premia la estandarización del “delivery” y penaliza el modelo de carpetas ad hoc. citeturn4view0turn4view1

También es acertado el concepto de **Information Products**. La regulación no exige que todo se publique como un PDF monolítico; exige que los registros esenciales sean completos, legibles, accesibles, versionados y trazables, y que el responsable conserve el original o una copia certificada válida. ICH E6(R3) incluso contempla que sponsor e investigator puedan necesitar acceso a copias relevantes de los registros del otro durante el estudio, incluyendo acceso por portal, pero al final cada parte debe retener sus propios essential records. Eso encaja directamente con “Capability Matrix”, “Evidence Package”, “Regulatory Starter Kit” y “Study Readiness Package” como productos derivados de una misma base de evidencia. citeturn3view4

El módulo propuesto de **Document Vault** también está bien encaminado. La guía de EMA sobre TMF/eTMF exige que los documentos tengan identificación, version history, search and retrieval, y que cualquier alteración sea trazable; además, cuando el archivo del investigator se externaliza, la liberación o acceso remoto debe requerir la aprobación del investigator/institution y el sponsor/CRO no debe tener acceso directo al investigator TMF. Ese marco es mucho más parecido a un VDR regulado que a un simple file storage. citeturn2view1turn3view4

El plan acierta igualmente al incorporar **Sharing** y **Audit** como capacidades nativas, no como “extras”. EMA exige para acceso remoto a documentación clínica sensible medidas como autenticación fuerte, acceso limitado a los documentos necesarios, acceso de solo lectura, logging atribuible a persona física, ventanas temporales acotadas, cifrado durante transmisión y registros de quién accedió, cuándo y con qué propósito operativo. FDA, por su parte, exige que los sistemas electrónicos, registros electrónicos y firmas electrónicas en investigaciones clínicas sean confiables, íntegros y equivalentes en términos regulatorios al papel y la firma manuscrita cuando corresponda. citeturn7view0turn2view2

Finalmente, la idea de un **Study-aware Publication** tiene muchísimo potencial, pero no debe tratarse como fantasía de producto, sino como una capacidad de interoperabilidad y matching. CDISC viene empujando modelos de representación digital de protocolo y Study Definition API; HL7 FHIR ResearchStudy contempla uso para comunicar información de protocolo entre stakeholders y soportar el setup de sitios y formularios. Eso no prueba que Kadarn deba usar FHIR en el MVP, pero sí valida que convertir un protocolo en requisitos y luego en paquetes de evidencia es una dirección técnicamente coherente con la evolución del ecosistema. citeturn6view1turn6view3

## Lo que corregiría del plan actual

La primera corrección es de **frontera arquitectónica**. El PDL sí debe existir, pero **no debería absorber todo lo que sea policy, sharing, export y UI como si fuera un único bloque vertical cerrado**. Mi recomendación es que el PDL sea el dominio de orquestación y empaquetado, mientras que el control de acceso, la firma de links, la gestión de permisos, el watermarking, los consentimientos/NDA y la auditoría funcionen como **servicios de plataforma reutilizables** consumidos por el PDL. Esa corrección es una inferencia arquitectónica mía, pero está respaldada por la exigencia regulatoria de controles de seguridad, autenticación, trazabilidad y separación de responsabilidades. citeturn3view3turn7view0turn2view2

La segunda corrección es conceptual: **“Document Vault reemplaza completamente la idea de descargar un ZIP” es demasiado absoluto**. No lo reemplazaría; lo gobernaría. La industria sigue necesitando transferencias estructuradas, exports y archivado controlado. CDISC describe el TMF Standard como la base estándar para organizar y **exchange** de documentación esencial, y la Exchange Mechanism Standard contempla precisamente exports con inventario, validación, checksums y transferencia entre sistemas eTMF. Por tanto, la arquitectura correcta no es “sin ZIP”, sino “sin ZIPs manuales ni opacos”; el ZIP, PDF o XML deben convertirse en **salidas generadas por reglas**, no en la unidad primaria de gestión. citeturn6view0turn6view2

La tercera corrección tiene que ver con **Marketplace** y **Digital Twin**. Yo no los pondría como salidas del mismo nivel dentro del MVP del PDL. El Marketplace es más bien un **canal/comercial surface** y el Digital Twin es una **experiencia de exploración**. Ambos deberían consumir la Delivery API del PDL, no formar parte del “núcleo mínimo” del nuevo dominio. Si Kadarn mezcla desde el inicio empaquetado regulatorio, sharing seguro, AI navigation y marketplace, corre el riesgo de diluir el programa sin cerrar primero el terreno regulatorio-operativo que realmente crea valor. Esta priorización también es consistente con la evidencia de que la industria todavía gana más eficiencia reduciendo duplicación documental y estandarizando intercambio que lanzando experiencias avanzadas antes de estabilizar el modelo de records. citeturn4view1turn6view0turn3view4

La cuarta corrección es sobre **FHIR**. En el plan aparece como posibilidad futura, y eso está bien, pero yo no lo pondría como deliverable temprano del Export Engine. Para MVP, la apuesta correcta es **OpenAPI + JSON + PDF controlado + ZIP/manifest exportado**. El propio trabajo de CDISC sobre Digital Data Flow resalta OpenAPI y APIs estandarizadas para Study Definition; FHIR aparece como extensión de interoperabilidad, no como requisito inicial universal. Además, FHIR ResearchStudy sirve mejor para representar el estudio/protocolo que para resolver por sí solo la distribución de CVs, licencias, certificados o paquetes regulatorios de sitio. citeturn6view1turn6view3

La quinta corrección es de nomenclatura y de roadmap. En el texto propuesto aparece “## KRM-A7” para el PDL, pero más abajo A7 ya está reservado para Institution Digital Twin. Eso debe corregirse. Si la taxonomía que propones ya ubica A7, A8 y A9, entonces el nuevo dominio **debería quedar formalmente como A10** y no A7. Esa corrección no es regulatoria; es de integridad del propio master plan propuesto.

## Arquitectura objetivo corregida

La mejor versión de esta idea no es “agregar una capa más” sin refactor, sino introducir un dominio claro llamado **Publication and Delivery Domain** con interfaces bien definidas hacia arriba y hacia abajo. Yo lo dejaría así:

```text
Evidence Sources
      ↓
Evidence Core
      ↓
Knowledge and Confidence Services
      ↓
Publication and Delivery Domain
      ├─ Package Orchestrator
      ├─ Package Definitions and Templates
      ├─ Document Control and Vault
      ├─ Entitlement and Policy Adapter
      ├─ Share and Export Service
      ├─ Delivery API
      └─ Audit and Access Ledger
      ↓
Consumer Channels
      ├─ Institution Passport
      ├─ Capability Matrix
      ├─ Evidence Package
      ├─ Investigator Package
      ├─ Regulatory Starter Kit
      ├─ Study Readiness Package
      ├─ Historical Portfolio
      └─ Digital Twin / External Apps
```

La clave aquí es que el **Evidence Core siga siendo sistema de registro y procedencia**, mientras que el nuevo dominio solo construya “publication views” a partir de referencias inmutables, metadatos y reglas. ICH E6(R3) apoya esta separación porque exige que los registros esenciales se mantengan en repositorios definidos, con localización conocida, versionado, search/retrieval y alteraciones trazables, y permite acceso cruzado por copia o portal sin borrar la responsabilidad de origen de cada parte. citeturn3view4turn3view5

También recomiendo cambiar el nombre del “Access Policy Engine” por algo más preciso, como **Entitlement and Disclosure Policy Service**. El problema real no es solo “quién puede entrar”, sino **qué claim, qué documento, qué parte redacted, por cuánto tiempo, bajo qué base contractual y con qué nivel de evidentiary confidence** puede exponerse a cada actor. Ese matiz importa especialmente porque EMA distingue entre acceso remoto, visualización remota, limitación de documentos al mínimo necesario, lectura solo en la medida requerida, trazabilidad por persona, cifrado y acuerdos escritos entre las partes. citeturn7view0turn7view1

En esa arquitectura, el **Package Builder** debe trabajar sobre una entidad formal llamada **Package Definition**. Cada definición debería incluir: audiencia objetivo, claims incluidos, reglas de elegibilidad, records requeridos, redaction policy, formato de exportación, SLA de expiración, watermark policy, y retention/audit behavior. Con esto, “Institution Passport”, “Capability Matrix” y “Regulatory Starter Kit” dejan de ser solo features y pasan a ser **arquetipos de publicación** gobernados. Este diseño además se alinea con el enfoque de CDISC de taxonomía y metadata estándar para TMF y con los mecanismos de intercambio validados por manifest y metadata. citeturn6view0turn6view2

Yo añadiría además dos objetos de dominio que no aparecen explícitos en el plan y que considero indispensables. El primero es **Disclosure Unit**, que representa la mínima unidad publicable: puede ser un documento, una sección, un claim con sus evidencias, o un bundle lógico de records. El segundo es **Share Grant**, que representa la concesión temporal a un sponsor/CRO/vendor específico, con scope, expiración, policy, watermark y auditoría. Esa granularidad responde mucho mejor a lo que piden EMA e ICH que un modelo de “portal todo o nada”. citeturn7view0turn3view4

## Roadmap recomendado y cambios al master plan

Yo mantendría la decisión de crear un nuevo dominio top-level, pero **reordenaría** las releases para reducir riesgo. El roadmap actual empieza demasiado pronto con productos visibles y demasiado tarde con gobierno documental. En clínico-regulatorio conviene construir primero el plano de control y luego las experiencias.

La secuencia que recomiendo es la siguiente. Primero, una fase **PDL-0 Foundation and Controls**, donde se entreguen los identificadores canónicos de disclosure units, package definitions, metadatos de documento, integración con audit, entitlements y export jobs. Sin esta base, el resto escala mal y genera deuda. La necesidad de version history, search/retrieval, traceable alteration, security controls y retención adecuada está claramente exigida por ICH E6(R3), EMA TMF y FDA electronic systems guidance. citeturn3view4turn3view3turn2view2

Después haría una fase **PDL-1 Controlled Read Models**, con Institution Passport, Capability Matrix y Evidence Package. Esta release debe enfocarse en **lectura segura y explicable**, no todavía en intercambio documental complejo. Aquí el objetivo es demostrar que Kadarn puede exponer claims, evidencias, confidence y limitaciones de forma trazable y auditable, sin comprometer el control de records esenciales. Eso está muy alineado con el propósito de los essential records como base para oversight, monitoring, audit e inspection. citeturn3view4

La siguiente fase debería ser **PDL-2 Document Governance**, e incluir Document Vault, certified-copy logic, expirations, document state model, y paquetes regulatorios controlados. Aquí ya entran Investigator Package, Regulatory Starter Kit y descargas selectivas. Este orden es importante porque FDA exige que el sponsor obtenga y documente información sobre las calificaciones del investigator, el sitio, los laboratorios y el IRB antes de iniciar; el bundle regulatorio, por tanto, no es un nice-to-have, sino una salida operacional central del nuevo dominio. citeturn2view4turn2view5

Luego avanzaría a **PDL-3 Secure Sharing and External Exchange**, donde sí aparecen links temporales, read-only workspaces, watermarking, external reviewer sessions, export ZIP con manifest, and package handoff. Ese punto debe incorporar explícitamente las restricciones de EMA para acceso remoto: autenticación fuerte, tiempo limitado, log atribuible, limitación al mínimo necesario, cifrado y ausencia de grabación indebida. También es aquí donde tiene más sentido mapear exports a taxonomías CDISC TMF o mecanismos de intercambio eTMF cuando aplique. citeturn7view0turn6view0turn6view2

Por último dejaría **PDL-4 Study-aware Publication and Experience Layer**, con ingestion de protocolo, matching de requerimientos, generación automática de study packages, compare institutions y Digital Twin. CDISC y HL7 validan que el protocolo y el estudio se están moviendo hacia representaciones estructuradas e interoperables, pero eso todavía debe ponerse al servicio del caso de uso correcto, no convertirse en complejidad prematura del MVP. citeturn6view1turn6view3

En el master plan, entonces, mi recomendación concreta es: **incorporar A10 Publication and Delivery Domain** como nuevo dominio de primer nivel, y redefinir A7/A8/A9 como consumidores o dominios adyacentes según la taxonomía que ya venían usando. Si el material interno ya fijó A7 como Institution Digital Twin, no debe reciclarse esa etiqueta para el PDL. Más importante aún, el master plan debería dejar explícito que **Sponsor Intelligence deja de ser la terminal del pipeline** y pasa a ser un productor de conocimiento que el PDL empaqueta y entrega. Esa es la corrección estratégica más importante del documento original.

## Decisiones concretas que tomaría ahora

Si tuviera que convertir este judgment en decisiones de arquitectura inmediatamente accionables, tomaría cinco.

La primera sería aprobar el dominio, pero con nombre exacto **Publication and Delivery Domain** o **Publication and Exchange Domain**. “Layer” describe bien la ubicación, pero “Domain” describe mejor la responsabilidad y evita que se perciba como mera UI. Esa sutileza importa porque el trabajo real no es de presentación, sino de control de records, disclosure y empaquetado. citeturn3view4turn6view0

La segunda sería fijar que el **Passport no es el producto principal**. El producto principal es el sistema de publication rules y package assembly; el Passport es solo una de sus vistas. Esto está bien soportado por la realidad operativa del ecosistema: TransCelerate ha invertido precisamente en forms y templates estandarizados para reducir el envío repetitivo de información de sitio, no en un único “superdocumento” universal. citeturn4view0turn4view1

La tercera sería establecer que el **Document Vault es sistema de control**, no solo repositorio. Debe manejar versionado, vigencia, owner, visibility, redaction class, regulatory classification, certified copy status, linked claims, linked studies y audit trail. ICH E6(R3) y EMA dejan muy claro que los records deben ser identificables, versionados, rastreables y retenidos bajo responsabilidad explícita. citeturn3view4turn2view1

La cuarta sería diseñar una **Delivery API única** con contratos estables y formatos pragmáticos: JSON para integración, PDF para lectura humana, ZIP con manifest cuando haya transferencia paquetizada, y OpenAPI como especificación del contrato. CDISC Digital Data Flow respalda el uso de APIs estandarizadas y OpenAPI como base de interoperabilidad; CDISC TMF y la Exchange Mechanism Standard respaldan la necesidad de metadata estructurada y transferencia verificable. citeturn6view1turn6view2turn6view0

La quinta sería declarar que **FHIR no entra en el MVP** del delivery de sitio-investigador, aunque sí puede quedar como target de interoperabilidad futura para estudio/protocolo. Esa decisión no es conservadora; es disciplinada. FHIR ResearchStudy y el trabajo CDISC/HL7 son promisorios para study definition y protocol exchange, pero hoy no resuelven por sí mismos la gobernanza fina de CVs, licencias, certificados, policies de acceso y disclosure granulado que este bloque necesita. citeturn6view3turn6view1

## Recomendación final sobre el plan

Mi recomendación final es **aprobar el plan en su dirección estratégica, pero corregirlo antes de codificarlo**.

Aprobaría sin dudar estas tres ideas: crear un nuevo dominio arquitectónico, dejar de pensar en “qué PDF le damos al sponsor”, y modelar la salida como **Information Products** derivados de una base de evidencia gobernada. Esas tres decisiones están sólidamente respaldadas por ICH E6(R3), EMA, FDA y por los esfuerzos de estandarización de TransCelerate y CDISC para reducir duplicación, mejorar intercambio y sostener inspeccionabilidad. citeturn3view4turn2view1turn2view2turn4view1turn6view0

Corregiría, sin embargo, estos puntos antes de integrarlo al master plan: cambiar “KRM-A7” por **A10**, separar servicios transversales de policy/audit/sharing del núcleo del PDL, tratar exports como salidas gobernadas en vez de negarlos, bajar Marketplace y Digital Twin a la categoría de consumidores del dominio, y mover FHIR fuera del MVP. Además, formalizaría Package Definitions, Disclosure Units y Share Grants como objetos de dominio de primer nivel. Esas correcciones hacen que la propuesta pase de ser una intuición potente a una arquitectura implementable y defendible. citeturn7view0turn6view0turn6view2turn6view1

En una sola frase: **sí, el executive judgment va en la dirección correcta; no, aún no está listo para entrar al master plan sin ajuste; y la mejor versión de esa idea es un Publication and Delivery Domain regulatoriamente gobernado, con APIs, paquetes, controles de disclosure y experiencias consumidoras sobre una misma base de evidencia inmutable.** citeturn3view4turn2view1turn2view2turn4view1turn6view1