module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    copy: {
      dev: {
        expand: true,
        cwd: "assets/",
        src: ["images/*"],
        dest: ".tmp/"
      }
    },

    emberTemplates: {
      dev: {
        options: {
          templateBasePath: /assets\/views\//
        },
        files: {
          ".tmp/templates.js": "assets/views/**/*.hbs"
        }
      }
    },

    concat: {
      dev: {
        files: {
          ".tmp/app.js":  [
            "assets/js/vendor/jquery-1.9.1.js",
            "assets/js/vendor/handlebars-1.0.0.js",
            "assets/js/vendor/ember-1.0.0.js",
            "assets/js/app.js",
            ".tmp/templates.js"
          ],
          ".tmp/app.css": [
            "assets/css/vendor/pure-0.3.0.css",
            "assets/css/app.css"
          ]
        }
      }
    },

    watch: {
      dev: {
        files: ["assets/**/*"],
        tasks: ["assets"]
      }
    },

    nodemon: {
      dev: {
        options: {
          file: "app.js"
        }
      }
    },

    concurrent: {
      dev: {
        tasks: ["nodemon", "watch"],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-ember-templates");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-nodemon");
  grunt.loadNpmTasks("grunt-concurrent");

  grunt.registerTask("assets", ["copy", "emberTemplates", "concat"]);
  grunt.registerTask("dev", ["assets", "concurrent"]);
};
