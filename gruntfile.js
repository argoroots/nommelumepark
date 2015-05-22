module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            build: {
                src: 'tmp'
            },
        },
        copy: {
            fonts: {
                cwd: 'bower_components/ionic/release/',
                src: ['fonts/*.*'],
                dest: '',
                expand: true,
                // flatten: true,
            }
        },
        jade: {
            html: {
                options: {
                    pretty: true,
                },
                files: [{
                    expand: true,
                    cwd: 'source/views',
                    src: ['index.jade'],
                    dest: 'tmp',
                    ext: '.html'
                }]
            }
        },
        stylus: {
            css: {
                files: {
                    'tmp/application.css': [
                        'source/stylesheets/*.styl'
                    ]
                }
            }
        },
        replace : {
            frameworks: {
                replacements: [{
                    from: '../fonts/',
                    to: './fonts/'
                }],
                src: ['bower_components/ionic/release/css/ionic.css'],
                dest: 'tmp/ionic.css'
            }
        },
        cssmin : {
            frameworks: {
                options: {
                    keepSpecialComments: 0,
                },
                files: {
                    'tmp/stylesheet.css': [
                        'tmp/ionic.css',
                        'tmp/application.css'
                    ]
                }
            }
        },
        uglify: {
            frameworks: {
                files: {
                    'tmp/javascript.js': [
                        'bower_components/ionic/release/js/ionic.bundle.js',
                        'bower_components/angular-resource/angular-resource.js',
                        'source/javascripts/*.js'
                    ]
                }
            }
        },
        includereplace: {
            all: {
                files: {
                    'index.html': [
                        'tmp/index.html'
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 4000,
                    base: './',
                    hostname: 'localhost'
                }
            }
        },
        watch: {
            stylesheets: {
                files: 'source/**/*.styl',
                tasks: ['stylus', 'cssmin', 'includereplace']
            },
            scripts: {
                files: 'source/**/*.js',
                tasks: ['uglify', 'includereplace']
            },
            jade: {
                files: 'source/**/*.jade',
                tasks: ['jade', 'includereplace']
            },
        }
    })

    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-connect')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-cssmin')
    grunt.loadNpmTasks('grunt-contrib-jade')
    grunt.loadNpmTasks('grunt-contrib-less')
    grunt.loadNpmTasks('grunt-contrib-stylus')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-watch')
    grunt.loadNpmTasks('grunt-include-replace')
    grunt.loadNpmTasks('grunt-text-replace')

    grunt.registerTask(
        'build',
        'Compiles all of the assets and copies the files to the build directory. Cleanup all mess.',
        ['clean', 'copy', 'jade', 'stylus', 'replace', 'cssmin', 'uglify', 'includereplace']
    )

    grunt.registerTask(
        'default',
        'Watches the project for changes, automatically builds them and runs a server.',
        ['build', 'connect', 'watch']
    )
}
