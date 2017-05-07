const path = require('path');
const fis = require('fis3');

/* default weight */
const weight = -100;
/* default weight of the namespace */
const weightWithNs = -50;

fis.cli.name = "fisa";
fis.cli.info = fis.util.readJSON(__dirname + '/package.json');
fis.require.prefixes = ['fisa', 'fis3', 'fis'];
fis.cli.help.commands = ['release', 'install', 'server', 'init'];

fis.set('namespace', '');
fis.set('statics', '/static');
fis.set('templates', '/WEB-INF/views');
/* default use jello server */
fis.set('server.type', 'jello');
/**
 * 挂载 commonJs 模块化插件,
 * 如果要使用 amd 方案，请先执行fis.unhook('commonjs');然后再执行fis.hook('amd');
 * 注意：多个模块化方案插件不能共用。
 */
fis.hook('commonjs');

fis
    .match('*.{sass,scss}', {
        parser: fis.plugin('node-sass'),
        rExt: '.css'
    }, weight)

    // 对 tmpl 文件，默认采用 utc 插件转换成 js 函数。
    .match('*.tmpl', {
        parser: fis.plugin('utc'),
        rExt: '.js'
    }, weight)

    // 对 vm 和 jsp 进行语言识别。
    .match('*.{vm,jsp}', {
        preprocessor: fis.plugin('extlang')
    }, weight)

    // 所有文件默认放 static 目录下面。后续会针对部分文件覆盖此配置。
    .match('*', {
        release: '${statics}/${namespace}/$0'
    }, weight)

    // 标记 components 、 page 和 widget 目录下面的 js 都是模块。
    .match('/{components,page,widget}/**.js', {
        isMod: true
    }, weight)

    // static 下面的文件直接发布到 $statics 目录，为了不多一层目录 static。
    .match('/static/(**)', {
        release: '${statics}/${namespace}/$1'
    }, weight)

    // test 目录原封不动发过去。
    .match('/test/(**)', {
        release: '/test/${namespace}/$1',
        isMod: false,
        useCompile: false
    }, weight)

    // widget下进行模块化封装
    .match('/widget/**.{jsp,vm,html}', {
        url: '$0',
        release: '${templates}/${namespace}/$0',
        isMod: true
    }, weight)

    .match('/{page}/**.{jsp,vm,html}', {
        isMod: true,
        url: '$0',
        release: '${templates}/${namespace}/$0',
        extras: {
            isPage: true
        }
    }, weight)

    // map.json发布路径
    .match('{map.json,${namespace}-map.json}', {
        release: '/WEB-INF/config/$0'
    }, weight)

    // 注意这类文件在多个项目中都有的话，会被最后一次 release 的覆盖。
    .match('{fis.properties,server.conf}', {
        release: '/WEB-INF/$0'
    }, weight)

    .match('**/README.md', {
        release: false
    })

    .match('server.conf', {
        release: '/WEB-INF/server${namespace}.conf'
    })

    // 默认情况下， Velocity 搜寻一个单一的库VM_global_library.vm
    .match('VM_global_library.vm', {
        release: '/${templates}/VM_global_library.vm'
    }, weight)

    // _ 下划线打头的都是不希望被产出的文件。
    .match('_*.*', {
        release: false
    }, weight)

    // 脚本文件默认不产出
    .match('**.{sh,bat}', {
        release: false
    }, weight)

    // 自动产出 map.json
    .match('::package', {
        postpackager: function (ret) {
            var root = fis.project.getProjectPath();
            var ns = fis.get('namespace');
            var mapFile = ns ? (ns + '-map.json') : 'map.json';
            var map = fis.file.wrap(path.join(root, mapFile));
            map.setContent(JSON.stringify(ret.map, null, map.optimizer ? null : 4));
            ret.pkg[map.subpath] = map;
        }
    }, weight);


// 在 prod 环境下，开启各种压缩和打包。
fis.media('prod')
    .match('*.js', {
        useHash: true,
        optimizer: fis.plugin('uglify-js')
    }, weight)

    .match('*.{scss,css}', {
        useHash: true,
        optimizer: fis.plugin('clean-css')
    }, weight)

    .match('*.png', {
        useHash: true,
        optimizer: fis.plugin('png-compressor')
    }, weight)

    // 默认本地发布到与当前路径同级
    .match('*', {
        deploy: fis.plugin('local-deliver', {
            to: '../output-prod'
        })
    }, weight);

// 当用户 fis-conf.js 加载后触发。
fis.on('conf:loaded', function () {
    if (!fis.get('namespace')) return;
    fis.match('/{page,widget}/**.{jsp,vm,html}', {
        url: '/${namespace}$0'
    }, weightWithNs);
});

module.exports = fis;