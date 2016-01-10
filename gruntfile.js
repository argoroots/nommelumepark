module.exports = function(grunt) {
    grunt.initConfig({
        clean: {
            build: {
                src: ['tmp', 'fonts']
            },
            postbuild: {
                src: ['tmp']
            }
        },
        copy: {
            glyphicons: {
                src: ['bower_components/bootstrap/fonts/*.*'],
                dest: 'fonts',
                expand: true,
                flatten: true,
            }
        },
        jade: {
            html: {
                options: {
                    pretty: false,
                },
                files: [{
                    expand: true,
                    cwd: 'views',
                    src: ['index.jade'],
                    dest: 'tmp',
                    ext: '.html'
                }]
            }
        },
        stylus: {
            css: {
                files: {
                    'tmp/application.css': ['stylesheets/*.styl']
                }
            }
        },
        cssmin : {
            application: {
                options: {
                    keepSpecialComments: 0,
                },
                files: {
                    'tmp/stylesheet.css': [
                        'bower_components/bootstrap/dist/css/bootstrap.css',
                        'tmp/application.css'
                    ]
                }
            }
        },
        uglify: {
            application: {
                files: {
                    'tmp/javascript.js': [
                        'bower_components/jquery/dist/jquery.js',
                        'bower_components/bootstrap/dist/js/bootstrap.js',
                        'bower_components/angular/angular.js',
                        'bower_components/angular-route/angular-route.js',
                        'bower_components/async/dist/async.js',
                        'bower_components/datejs/build/date.js',
                        'javascripts/*.js'
                    ]
                }
            }
        },
        includereplace: {
            all: {
                files: {
                    'index.html': ['tmp/index.html']
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 4000,
                    base: '',
                    hostname: 'localhost'
                }
            }
        },
        watch: {
            stylesheets: {
                files: '**/*.styl',
                tasks: ['stylus', 'cssmin:application', 'jade', 'includereplace']
            },
            scripts: {
                files: '**/*.js',
                tasks: ['uglify:application', 'jade', 'includereplace']
            },
            jade: {
                files: '**/*.jade',
                tasks: ['jade', 'includereplace']
            },
        }
    })

    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-connect')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-cssmin')
    grunt.loadNpmTasks('grunt-contrib-jade')
    grunt.loadNpmTasks('grunt-contrib-stylus')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-watch')
    grunt.loadNpmTasks('grunt-include-replace')

    grunt.registerTask(
        'prepare',
        'Compiles all of the assets and copies the files to the build directory.',
        ['clean:build', 'copy', 'jade', 'stylus', 'cssmin', 'uglify', 'includereplace']
    )

    grunt.registerTask(
        'build',
        'Compiles all of the assets and copies the files to the build directory. Cleanup all mess.',
        ['prepare', 'clean:postbuild']
    )

    grunt.registerTask(
        'default',
        'Watches the project for changes, automatically builds them and runs a server.',
        ['prepare', 'connect', 'watch']
    )
}
