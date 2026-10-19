// General-purpose questions patients can bring to a visit. These are prompts
// for a conversation, not medical content. Modeled on the AHRQ "Questions Are
// the Answer" materials (https://www.ahrq.gov/questions/index.html) and the
// NIA "Talking With Your Doctor" guide (https://www.nia.nih.gov/health/doctor-patient-communication).

export const QUESTION_SOURCES = [
  { org: "Agency for Healthcare Research and Quality", title: "Questions Are the Answer", url: "https://www.ahrq.gov/questions/index.html" },
  { org: "National Institute on Aging", title: "Doctor–patient communication", url: "https://www.nia.nih.gov/health/doctor-patient-communication" },
];

export const Q_CATEGORIES = [
  { id: "understand", en: "Understanding", es: "Entender" },
  { id: "tests", en: "Tests", es: "Pruebas" },
  { id: "treatment", en: "Treatment", es: "Tratamiento" },
  { id: "medicines", en: "Medicines", es: "Medicamentos" },
  { id: "procedures", en: "Procedures", es: "Procedimientos" },
  { id: "life", en: "Daily life", es: "Vida diaria" },
  { id: "followup", en: "Follow-up", es: "Seguimiento" },
];

export const QUESTION_BANK = {
  understand: [
    { en: "Can you explain what you think is going on, in plain words?", es: "¿Puede explicarme en palabras sencillas lo que cree que está pasando?" },
    { en: "What should I keep track of before my next visit?", es: "¿Qué debo anotar o vigilar antes de mi próxima cita?" },
    { en: "Where can I find reliable information to learn more?", es: "¿Dónde puedo encontrar información confiable para aprender más?" },
    { en: "Could you write down the name of my condition for me?", es: "¿Podría escribirme el nombre de mi afección?" },
  ],
  tests: [
    { en: "Why do I need this test, and what will it tell us?", es: "¿Por qué necesito esta prueba y qué nos dirá?" },
    { en: "How do I prepare for the test?", es: "¿Cómo me preparo para la prueba?" },
    { en: "When and how will I get my results?", es: "¿Cuándo y cómo recibiré mis resultados?" },
    { en: "What will the results mean for my next steps?", es: "¿Qué significarán los resultados para mis próximos pasos?" },
  ],
  treatment: [
    { en: "What are my treatment options?", es: "¿Cuáles son mis opciones de tratamiento?" },
    { en: "What are the benefits and risks of each option?", es: "¿Cuáles son los beneficios y riesgos de cada opción?" },
    { en: "What happens if I wait or choose not to treat this right now?", es: "¿Qué pasa si espero o decido no tratarlo por ahora?" },
    { en: "How will we know if the treatment is working?", es: "¿Cómo sabremos si el tratamiento está funcionando?" },
  ],
  medicines: [
    { en: "What is this medicine for, and how should I take it?", es: "¿Para qué es este medicamento y cómo debo tomarlo?" },
    { en: "What side effects should I watch for?", es: "¿A qué efectos secundarios debo prestar atención?" },
    { en: "Could it interact with my other medicines or supplements?", es: "¿Puede interactuar con mis otros medicamentos o suplementos?" },
    { en: "Is there a lower-cost option if I need one?", es: "¿Hay una opción de menor costo si la necesito?" },
  ],
  procedures: [
    { en: "Why do you recommend this procedure for me?", es: "¿Por qué me recomienda este procedimiento?" },
    { en: "What should I do to prepare, and what should I bring?", es: "¿Qué debo hacer para prepararme y qué debo llevar?" },
    { en: "Will I need someone to drive me home?", es: "¿Necesitaré que alguien me lleve a casa?" },
    { en: "What will recovery look like for me?", es: "¿Cómo será mi recuperación?" },
  ],
  life: [
    { en: "Are there activities I should change or avoid for now?", es: "¿Hay actividades que debo cambiar o evitar por ahora?" },
    { en: "Can I keep working and doing my usual hobbies?", es: "¿Puedo seguir trabajando y haciendo mis pasatiempos?" },
    { en: "Is there anything I can do at home that might help?", es: "¿Hay algo que pueda hacer en casa que me ayude?" },
  ],
  followup: [
    { en: "When should I come back or check in?", es: "¿Cuándo debo regresar o comunicarme?" },
    { en: "Who do I contact with questions after this visit, including after hours?", es: "¿A quién contacto si tengo preguntas después de esta cita, incluso fuera del horario?" },
    { en: "Which changes mean I should call you or get urgent care?", es: "¿Qué cambios significan que debo llamarle o buscar atención urgente?" },
  ],
};

/** Questions for a specific health topic; {topic} is filled with its title. */
export const TOPIC_QUESTIONS = [
  { en: "What do you think is causing my symptoms, and how sure are you?", es: "¿Qué cree que está causando mis síntomas y qué tan seguro está?" },
  { en: "Do I need any tests related to {topic}?", es: "¿Necesito alguna prueba relacionada con {topic}?" },
  { en: "What treatment options are there for {topic}, and which do you suggest for me?", es: "¿Qué opciones de tratamiento hay para {topic} y cuál me sugiere?" },
  { en: "Is there anything I can do at home or at work that might help?", es: "¿Hay algo que pueda hacer en casa o en el trabajo que me ayude?" },
  { en: "What changes should make me contact you before my next visit?", es: "¿Qué cambios deberían hacer que le contacte antes de mi próxima cita?" },
];

/** Questions for each phase of a procedure guide. */
export const PHASE_QUESTIONS = {
  before: [
    { en: "Should I stop or change any medicines or supplements before {topic}?", es: "¿Debo dejar o cambiar algún medicamento o suplemento antes de: {topic}?" },
    { en: "Are there eating or drinking instructions I need to follow?", es: "¿Hay instrucciones sobre comer o beber que debo seguir?" },
    { en: "Will I need someone to drive me home?", es: "¿Necesitaré que alguien me lleve a casa?" },
  ],
  day: [
    { en: "How long will {topic} take, and how long will I be there?", es: "¿Cuánto durará: {topic}, y cuánto tiempo estaré allí?" },
    { en: "Will I be awake, and what will I feel?", es: "¿Estaré despierto(a) y qué sentiré?" },
    { en: "Who will explain the results, and when?", es: "¿Quién me explicará los resultados y cuándo?" },
  ],
  after: [
    { en: "What should my recovery look like, and when can I return to normal activities?", es: "¿Cómo debería ser mi recuperación y cuándo puedo volver a mis actividades?" },
    { en: "Which symptoms after {topic} mean I should call you?", es: "¿Qué síntomas después de: {topic}, significan que debo llamarle?" },
    { en: "When is my follow-up appointment?", es: "¿Cuándo es mi cita de seguimiento?" },
  ],
};

export const fillTopic = (text, topic) => text.replaceAll("{topic}", topic);

// Communication tips for the dashboard (about talking with a care team, not medical advice).
export const TIPS = [
  { en: "Write down your top three questions before your visit, and ask the most important one first.", es: "Escriba sus tres preguntas principales antes de la cita y haga primero la más importante.", src: QUESTION_SOURCES[0] },
  { en: "Bring a list of every medicine you take, including vitamins and supplements.", es: "Lleve una lista de todos los medicamentos que toma, incluidas vitaminas y suplementos.", src: QUESTION_SOURCES[0] },
  { en: "If something isn’t clear, it’s okay to ask, “Can you explain that another way?”", es: "Si algo no está claro, está bien preguntar: “¿Puede explicarlo de otra manera?”", src: QUESTION_SOURCES[1] },
  { en: "Repeat back what you heard in your own words. It helps you and your clinician check you’re on the same page.", es: "Repita con sus propias palabras lo que escuchó. Así usted y su médico confirman que se entendieron.", src: QUESTION_SOURCES[1] },
  { en: "If you’d prefer another language, ask whether a professional medical interpreter is available.", es: "Si prefiere otro idioma, pregunte si hay un intérprete médico profesional disponible.", src: QUESTION_SOURCES[1] },
  { en: "Bring a family member or friend to help listen and take notes, if that would help you.", es: "Si le ayuda, lleve a un familiar o amigo para escuchar y tomar notas.", src: QUESTION_SOURCES[1] },
];
