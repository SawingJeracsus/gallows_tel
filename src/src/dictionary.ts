import fs from 'fs'
import path from 'path'

export default class Dictionary{
    static dictionary = fs.readFileSync(path.join(__dirname,'../', 'dictionary.txt')).toString('utf-8').split('\r\n')
    static getWord(): string{
        return this.dictionary[Math.ceil(this.dictionary.length * Math.random()) - 1] 
    }
}