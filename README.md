# depx

load project modules (internal dependencies) the simplest way in a node.js environment


## usage
### install
    npm install depx --save

### in your boot file:
    require('depx')(__dirname); // maps all .js and .coffee files

#### configuration option defaults
    require('depx')(dir, {
      forceUpdateRootDir: false,
      extensions: ['js', 'coffee'],
      exclude: []
    });

### from this point on (including all `require()`-ed files)
    depx('mySharedLib amazingHelper')

    // ...

    console.log(mySharedLib, 'is now available as a local variable');
    console.log(amazingHelper, 'is available too');

## notes
- it will not cache `node_modules/**/*` stuff, but it will fall back to reqular `require` if it does not find a local includable
- it requires only on demand by default. If you want to pull in a module that exposes globals or has to be run immediately, mark it with a star and call it like this: `depx('*immediateModule')`
- syncronous mapping of local files when initialized: this is needed because `require` is syncronous itself, but it might add to the boot time a little if your project has many folders and files
- it will expose `depx()` on the global scope (and the alias `dep()` too)
- it will normalize dashes in the names of dependencies. E.g.: `dep('my-stuff')` will expose `my_stuff` as variable
- `dep.root` and `depx.root` will contain an absolute path to the dependency root directory (the resolved path to `dir` in `require('depx')(dir)`)
