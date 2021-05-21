export class Word {
    public chars: string []
    static from(word: Word): Word{
        return new Word(word.word, word.oppenedLetters)
    }
    constructor(
        public readonly word: string,
        public oppenedLetters: number[],
    ){
        this.chars = this.word.split('') || []
    }
    appendNewChars(chars: number[]){
        this.oppenedLetters = this.oppenedLetters.concat(chars)
    }
    get text(): string{
        const word: string[] = []
        this.chars.forEach((chr, i) => {
            if(this.oppenedLetters.includes(i)){
                word.push(chr)
            }else{
                word.push('#')
            }
        })
        return word.join('')
    }
    get isOppened() {
        return this.oppenedLetters.length === this.chars.length
    }
}
export class Game {
    static Word = Word
    openLetter(word: Word, letter: string): Word{
        if(letter.length !== 1){
            throw new Error('Letter should have 1 char of length!')
        }
        if(!word.chars.includes(letter)){
            throw new Error('Word dont containe a guess letter!')
        }
        //@ts-ignore
        const res: number[] = word.chars.map((chr, i) => {if(chr === letter)  return i}).filter(i => i !== undefined) 
        
        word.appendNewChars(res)        
        return word
    }
    createWord(text: string) {return new Word(text, [])}
}
