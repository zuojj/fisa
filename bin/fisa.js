#!/usr/bin/env node

const Liftoff = require('liftoff');
const path    = require('path');
const cli     = new Liftoff({
    name: 'fisa',
    processTitle: 'fisa',
    moduleName: 'fisa',
    configName: 'fis-conf',
    extensions: {
        '.js': null
    }
});

/**
 * exucte: fisa release prod -f ../fis-config.js -r ../
 * output: { _: [ 'release', 'prod'], f: '../fis-config.js', r: '../' } 
 */
var argv_2  = process.argv.slice(2),
    argv    = require('minimist')(argv_2);

cli.launch({
    cwd: argv.r || argv.root,
    configPath: argv.f || argv.file
}, function (env) {
    let fis = require(env.modulePath ?  env.modulePath : '../index.js');
    argv_2.unshift(this.name);

    // fisa release prod -f ../fis-config.js -r ../
    process.title = argv_2.concat(['[', env.cwd, ']']).join(' ');
    /**
     * first to find cwd path node_modules , 
     * not find, 
     * find gobal fisa install path node_modules
     */
    fis.require.paths.unshift(path.join(env.cwd, 'node_modules'));
    fis.require.paths.push(path.join(path.dirname(__dirname), 'node_modules'));
    fis.cli.name = this.name;
    fis.cli.run(argv, env);
});