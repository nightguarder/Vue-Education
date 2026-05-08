/**
 * AI Prompts configured for Gemma-4 via OMLX
 * These are stored here to keep the components clean.
 */

export const SYSTEM_BEHAVIOR =
  'Jste užitečný AI asistent. Do not output any internal monologue, thinking filter words, or meta-text. Output ONLY the final requested result directly.'

export const CLINICAL_CONTEXT = `Jste expertní AI klinický asistent. Váš uživatel je atestovaný dětský a dorostový psychiatr (ošetřující děti, adolescenty i dospělé). Vaším úkolem je analyzovat přepisy z vyšetření a poskytovat odbornou druhou ruku (second opinion). DŮLEŽITÉ: Nenavrhujte odeslání k psychiatrovi (pacient už u něj je). Místo toho navrhujte konkrétní diagnostické závěry, další vyšetřovací postupy, psychoterapeutické intervence nebo farmakoterapii přímo pro ošetřujícího lékaře. Odpovídejte stručně, vysoce odborně a k věci.`

export const SUMMARY_PROMPT = `Vytvoř prosím stručné a strukturované shrnutí výše uvedeného přepisu relace. Následně navrhni diagnostické hypotézy a konkrétní další klinický postup (např. terapie, medikace, testy) pro mě jako ošetřujícího psychiatra.`

export const CORRECTION_PROMPT = `Oprav gramatické chyby, překlepy a interpunkci v této části přepisu. NESMÍŠ psát žádné komentáře. Vrať POUZE opravený text.`

export const SPEAKER_DETECTION_PROMPT = `Analyzuj následující přepis konzultace. Identifikuj mluvčí (Lékař/Pacient) a vyčisti text od výplňkových slov.`

export function getSummaryAnalysisPrompt(transcript: string): string {
  return `Analyzuj následující přepis konzultace.

SNAŽ SE POROZUMĚT KONVERZACI:
- První mluvčí typicky zdraví a představuje se: "Dobrý den, jméno..."
- Druhý mluvčí odpovídá a představuje se
- Tazatel klade otázky (začíná na "Jak", "Co", "Proč", "Můžete", "Zmínil jste", "Povězte")
- Odpovídač popisuje zkušenosti ("Od roku", "Mám", "Zažívám", "Když")

POUŽIJ TATO PRAVIDLA:
- Lékař = klade otázky, formální "Vy", začíná zdravím
- Pacient = odpovídá, popisuje, "Já/Mám"

ÚKOL:
1. Identifikuj mluvčí (Lékař/Pacient).
2. Vytvoř stručné klinické shrnutí (hlavní obtíže, anamnéza, doporučení).
3. Oprav chyby a odstraň výplňková slova (hmm, eh, no, jo).

Přepis:
${transcript}`
}

export interface ChatContext {
  patientName: string
  patientAge?: number
  patientGender?: string
  aiSummary?: string
  transcript?: string
}

export function getChatSystemMessage(context: ChatContext): string {
  const parts = [
    'Jste expertní klinický asistent pracující s atestovaným dětským a dorostovým psychiatrem.',
    '',
    'PACIENT:',
    `  Jméno: ${context.patientName}`,
    `  Věk: ${context.patientAge || 'Neznámé'}`,
    `  Pohlaví: ${context.patientGender || 'Neznámé'}`,
  ]

  if (context.aiSummary) {
    parts.push('', 'KLINICKÉ SHRNUTÍ:', `  ${context.aiSummary}`)
  } else if (context.transcript) {
    parts.push(
      '',
      'POZNÁMKA: K dispozici je přepis konzultace (přibližně ' +
        context.transcript.length +
        ' znaků).',
    )
  }

  parts.push(
    '',
    'PRAVIDLA PRO ODPOVĚĎ:',
    '  1. Odpovídejte stručně, odborně a k věci (max 3-4 věty).',
    '  2. Nenavrhujte odeslání k psychiatrovi (pacient už u něj je).',
    '  3. Navrhujte konkrétní diagnostické závěry, vyšetřovací postupy, psychoterapii nebo farmakoterapii.',
    '  4. Neopakujte předchozí odpovědi - posuňte analýzu dál.',
    '  5. Reagujte na konkrétní dotaz lékaře v kontextu tohoto pacienta.',
  )

  return parts.join('\n')
}

export function getMessageContextPrompt(): string {
  return `Kontext této konverzace: Výše uvedená historie zpráv se týká pacienta ${'pacient'}. 
Odpovězte jako zkušený psychiatr na dotazy kolegy.`
}

export const WORKSHEET_KEY_POINTS_PROMPT = (abstract: string) => `
Vytvoř 3-5 stručných odrážek klíčových bodů z tohoto abstraktu v češtině. Formátuj jako Markdown seznam (pomocí -). Nepsat žádný úvodní text typu "zde jsou body", pouze samotné odrážky.
Abstrakt: ${abstract}
`

export const WORKSHEET_CLINICAL_IMPLICATIONS_PROMPT = (abstract: string) => `
Jaký je klinický dopad této studie pro lékaře v praxi? Odpověz stručně v češtině (max 2 věty). Neuváděj žádný úvodní ani závěrečný text.
Abstrakt: ${abstract}
`

export const WORKSHEET_SUMMARY_PROMPT = (abstract: string) => `
Napiš podrobné shrnutí této studie v češtině. Rozděl na ## Úvod, ## Metody a ## Výsledky pomocí Markdown nadpisů. Použij Markdown tučné písmo pro zvýraznění textu (**text**). Nepsat žádný úvodní ani závěrečný text, pouze samotné shrnutí.
Abstrakt: ${abstract}
`

export const WORKSHEET_SYSTEM_PROMPT =
  'Jste lékařský editor. Neuvádějte vnitřní monolog, přemýšlení ani doprovodný text.'

export const RESEARCH_SUMMARY_PROMPT = (sources: string, topic: string) => `
Na základě následujících webových zdrojů napiš komplexní výzkumnou zprávu v češtině.
Rozděl na ## Úvod, ## Klíčová zjištění, ## Klinické implikace a ## Shrnutí.
 Použij **tučný text** pro důležité pojmy.
Zdroje:
${sources}
Téma: ${topic}
`

export function getMedicationTrackerPrompt(context: ChatContext): string {
  return `Na základě klinického kontextu pacienta ${context.patientName} vytvoř personalizovaný pracovní list pro sledování nežádoucích účinků léků.

KLINICKÝ KONTEXT:
${context.aiSummary || context.transcript || 'Není k dispozici'}

ÚKOL:
1. Identifikuj léky, které pacient užívá nebo mu byly nově předepsány.
2. Pro každý lék uveď 3-4 nejčastější nebo relevantní nežádoucí účinky, které má pacient sledovat.
3. Vytvoř strukturovaný seznam v češtině.

FORMÁT (vrať POUZE JSON):
{
  "title": "Sledování nežádoucích účinků: [Jména léků]",
  "intro": "Tento pracovní list vám pomůže sledovat, jak vaše tělo reaguje na novou léčbu...",
  "medications": [
    {
      "name": "Název léku",
      "side_effects": [
        {"id": "se1", "label": "Název účinku (např. Sucho v ústech)", "type": "slider"}
      ]
    }
  ]
}`
}
