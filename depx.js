var coffeePulled, deproot,
    fs   = require('fs'),
    path = require('path'),
    info = {};


function recursivePullDir(extensions, root, dir, exclude) {
  var char, dpath, ext, i, name, node, parts,
      nodes = fs.readdirSync(root + path.sep + dir),
      len   = nodes.length;

  for (i = 0; i < len; i += 1) {
    node = nodes[i];
    char = node.substr(0, 1);
    if (char !== '.' && char !== '~' && char !== '!' && node !== 'node_modules' &&
      exclude.indexOf((dir ? dir + path.sep : '') + node) === -1
    ) {
      parts = node.split('.');
      ext   = parts.pop();
      name  = parts.join('.');
      dpath = root + path.sep + dir + path.sep + node;

      if (ext === 'coffee') {
        if (!coffeePulled) {
          require('coffee-script/register');
          coffeePulled = true;
        }
      }

      if (~extensions.indexOf(ext) && node.length - 1 > ext.length) { // file
        if (info.hasOwnProperty(name)) {
          throw new Error('Ambiguous includable: ' + dpath);
        }
        info[name] = {extension: ext, path: dpath, module: null};
      } else if (fs.lstatSync(dpath).isDirectory()) {
        recursivePullDir(extensions, root, (dir ? dir + path.sep : '') + node, exclude);
      }
    }
  }
}


function pull(dir, options) {
  var i, len,
      exclude = [];

  dir = path.resolve(dir);

  if (options == null) {
    options = {};
  }
  if (typeof options !== 'object') {
    throw new Error('options must be an object');
  }

  if (options.forceUpdateRootDir == null) {
    options.forceUpdateRootDir = false;
  }

  if (options.extensions == null) {
    options.extensions = ['js', 'coffee'];
  }

  if (typeof options.exclude === 'string') {
    exclude.push(options.exclude.split('/').join(path.sep).split('\\').join(path.sep));
  } else if (Array.isArray(options.exclude)) {
    for (i = 0, len = options.exclude.length; i < len; i += 1) {
      if (typeof options.exclude[i] !== 'string') {
        throw new Error('option exclude must only contain string or an array of strings');
      }
      exclude.push(options.exclude[i].split('/').join(path.sep).split('\\').join(path.sep));
    }
  } else if (options.exclude != null) {
    throw new Error('option exclude must only contain string or an array of strings');
  }

  if (deproot == null || options.forceUpdateRootDir) {
    deproot = dir;
  }

  try {
    stat = fs.lstatSync(dir);
  } catch (err) {
    throw new Error('not a directory: ' + dir);
  }

  recursivePullDir(options.extensions, dir, '', exclude);
}


function req(name, scoped, requestReturn) {
  var mod,
      conformName = name.split('\\').join('/').split('/').pop().split('-').join('_').split('.')[0];

  if (requestReturn || !scoped) {
    if (info.hasOwnProperty(name)) {
      mod = info[name].module = require(info[name].path);
    } else {
      mod = require(name);
    }

    if (scoped) {
      this[conformName] = mod;
    }

    return mod;
  } else {
    Object.defineProperty(this, conformName, {configurable: true, enumerable: true, get: function () {
      if (info.hasOwnProperty(name)) {
        return info[name].module = require(info[name].path);
      } else {
        return require(name);
      }
    }});
  }
}


function dep() {
  var i, i2, len2, name, names,
      args   = Array.prototype.slice.call(arguments),
      len    = args.length,
      res    = [],
      scoped = (module !== this && this && typeof this === 'object');

  for (i = 0; i < len; i += 1) {
    names = args[i].split(',').join(' ').split(' ');
    for (i2 = 0, len2 = names.length; i2 < len2; i2 += 1) {
      name = names[i2];
      if (name.substr(0, 1) === '*') {
        name = name.substr(1);
        res.push(req(name, scoped, true));
      } else {
        req(name, scoped, false);
      }
    }
  }

  if (res.length === 1) {
    return res[0]
  } else if (res.length > 1) {
    return res;
  }
};


module.exports = pull;

global.dep  = dep;
global.depx = dep;

dep.info = info;

Object.defineProperty(dep, 'root', {enumerable: true, get: function () {
  return deproot;
}});
