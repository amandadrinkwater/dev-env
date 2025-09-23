class Singleton {
    constructor() {
        if (Singleton.instance) {
            return Singleton.instance;
        }

      this.id = 'I am a singleton';
    }

    static getInstance() {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }

   someMethod()  {
       console.log('Singleton instance method called: ' + this.id + ' ');
   }
  
}

module.exports = { Singleton }

async  function main() {

    const singleton1 = Singleton.getInstance();
    const singleton2 = Singleton.getInstance();

    console.log(singleton1 === singleton2); // true

   singleton1.someMethod();
   singleton2.someMethod();

    console.log(singleton1);
    console.log(singleton2);
        
}

main()  