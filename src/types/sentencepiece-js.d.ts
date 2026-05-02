declare module 'sentencepiece-js' {
  export class SentencePieceProcessor {
    constructor()
    loadFromBuffer(buffer: Uint8Array): Promise<void>
    decode(ids: number[]): string
    encode(text: string): { tokens: string[]; ids: number[] }
    vocabSize(): number
  }
}
