module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    browserify: {
      build: {
        options: { 
          standalone: "Electro"
        },
        files: { "bin/electro.js": ["src/Electro.js"] }
      }
    },
    jshint: {
      options: {
        '-W004': true, /* variable redeclarations */
        node: true
      },
      test: ["src/**/*.js"]
    },
    mochacov: {
      cov: {
        options: {
          reporter: "html-cov",
          output: "./bin/coverage.html"
        },
        src: ["test/**/*.js"]
      },
      test: {
        options: {
          reporter: "spec"
        },
        src: ["test/**/*.js"]
      }
    },
    watch: {
      test: {
        files: ["src/**/*.js", "test/**/*.js"],
        tasks: ["test"]
      }
    },
    uglify: {
      dist: {
        files: { "bin/electro.min.js": ["bin/electro.js"] }
      }
    }
  });

  grunt.loadNpmTasks("grunt-browserify")
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks('grunt-mocha-cov');
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("build", ["browserify"]);
  grunt.registerTask("test", ["build", "jshint", "mochacov:test", "mochacov:cov"]);
  grunt.registerTask("dist", ["build", "uglify"]);
  
  grunt.registerTask("default", ["build"]);
};
