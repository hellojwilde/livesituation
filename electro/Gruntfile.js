module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    traceur: {
      build: {
        files: { "bin/": ["lib/**/*.js", "test/**/*.js"] }
      }
    },
    browserify: {
      build: {
        options: { 
          standalone: "Electro"
        },
        files: { "bin/electro.js": ["bin/lib/Electro.js"] }
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
    },
    uglify: {
      dist: {
        files: { "bin/electro.min.js": ["bin/electro.js"] }
      }
    }
  });

  grunt.loadNpmTasks("grunt-traceur");
  grunt.loadNpmTasks("grunt-browserify")
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("build", ["traceur", "browserify"]);
  grunt.registerTask("test", ["build", /*"jshint",*/ "mochaTest"]);
  grunt.registerTask("dist", ["build", "uglify"]);
  
  grunt.registerTask("default", ["build"]);
};
