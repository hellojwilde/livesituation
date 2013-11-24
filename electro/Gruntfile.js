module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    traceur: {
      build: {
        files: { "bin/": ["lib/**/*.js", "test/**/*.js"] }
      }
    },
    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> v<%= pkg.version %>, " +
                "built: <%= grunt.template.today('yyyy-mm-dd') %> */\n",
        wrap: "Electro"
      },
      dev: {
        options: {
          beautify: true,
          mangle: false
        },
        files: { "bin/electro.js": ["bin/lib/**/*.js"] }
      },
      dist: {
        options: {
          report: "min"
        },
        files: { "bin/electro.min.js": ["bin/lib/**/*.js"] }
      }
    },
    jshint: {
      options: {
        esnext: true,
        node: true
      },
      test: ["lib/**/*.js"]
    },
    mochaTest: {
      test: {
        options: {
          reporter: "spec"
        },
        src: ["bin/test/**/*.js"]
      }
    },
    watch: {
      test: {
        files: ["lib/**/*.js", "test/**/*.js"],
        tasks: ["test"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-traceur");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("default", ["traceur", "uglify:dev"]);
  grunt.registerTask("test", ["default", "jshint", "mochaTest"]);
  grunt.registerTask("dist", ["default", "uglify:dist"]);
};
