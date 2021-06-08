import fs from 'fs'
import path from 'path'

export default class Dictionary{
    static dictionary = fs.readFileSync(path.join(__dirname,'../', 'dictionary.txt')).toString('utf-8').split('\n').map( (word) => word.split('\r')[0])
    static getWord(): string{
        return this.dictionary[Math.ceil(this.dictionary.length * Math.random()) - 1] 
    }
}