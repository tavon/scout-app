var context = function(description, specDefinitions) {
  return jasmine.getEnv().describe(description, specDefinitions);
};

function wait(millis) {
  var date = new Date();
  var curDate = null;

  do { curDate = new Date(); }
  while(curDate-date < millis);
}

describe("Compass App", function(){
  beforeEach(function() {
    // stubs
    ScoutUtils.createProjectBySelectingDirectory = function(callback){
      new ProjectModel({
        name: "project-a",
        projectDir: "/some/path/project-a"
      }).save();
    };
    app.nukeAllProjects();
  });

  context("with no projects", function(){
    it("lists no projects", function(){
      expect($(".project").length).toBe(0);
    });
  });

  describe("adding a project", function(){
    it("adds the project to the list", function(){
      $(".option.add").click();
      expect($(".project:visible").length).toBe(1);
    });

    it("sets the project name to the folder name", function(){
      $(".option.add").click();
      Projects.get($(".project:last").attr("data-key"), function(project){
        expect(project.name).toBe("project-a");
      });
    });

    it("displays the configuration after adding the project", function(){
      $(".option.add").click();
      var project = $(".project:last");
      var visible_project_details = $(".project_details[data-key=" + project.attr('data-key') + "]:visible");
      expect(visible_project_details.length).toBe(1);
    });
  });

  describe("adding multiple projects", function(){
    beforeEach(function(){
      Projects.save({name: 'project-a'});
      $(".projects").trigger(":changed");
    });

    it("lists both projects", function(){
      ScoutUtils.createProjectBySelectingDirectory = function(callback){
        new ProjectModel({
          name: "project-b",
          projectDir: "/some/path/project-b"
        }).save();
      };
      $(".option.add").click();
      expect($(".project:visible").length).toBe(2);
    });
  });

  describe("editing a project in the project list", function(){
    beforeEach(function(){
      new ProjectModel({
        name: "project-a",
        projectDir: "/project-a/",
        sassDir: "/project-a/sass",
        cssDir: "/project-a/css",
        javascriptsDir: "/project-a/js",
        imagesDir: "/project-a/images"
      }).save();
      $(".projects").trigger(":changed");
      this.project = $(".project:contains('project-a')");
    });
    
    describe("double clicking a project's name", function(){
      beforeEach(function(){
        expect(this.project.find("a.name").is(":visible")).toBe(true);
        expect(this.project.find("input").is(":visible")).toBe(false);        
        this.project.find("a.name").dblclick();
      });
      
      it("puts you in inline-edit mode for the project name", function(){
        expect(this.project.find("a.name").is(":visible")).toBe(false);
        expect(this.project.find("input").is(":visible")).toBe(true);
      });
    });
    
    describe("pressing the <esc> key while editing a project's name", function(){
      beforeEach(function(){
        this.project_name = this.project.find("a.name").text();
        this.project.find("a.name").dblclick();
        this.project.find("input").val("foobarbaz");

        var e = jQuery.Event("keyup");
        e.which = 27; // # escape key code value
        this.project.find("input").trigger(e);
      });

      it("cancels editing the name", function(){        
        expect(this.project.find("a.name").is(":visible")).toBe(true);
        expect(this.project.find("input").is(":visible")).toBe(false);
        expect(this.project.find("a.name").text()).toBe(this.project_name);
      });
    });
    
    describe("pressing the <enter> key while editing a project's name", function(){
      beforeEach(function(){
        this.project_name = "foobarbaz";
        this.project.find("a.name").dblclick();
        this.project.find("input").val(this.project_name);

        var e = jQuery.Event("keyup");
        e.which = 13; // # escape key code value
        this.project.find("input").trigger(e);
      });
      
      it("saves the project name", function(){
        expect(this.project.find("a.name").is(":visible")).toBe(true);
        expect(this.project.find("input").is(":visible")).toBe(false);
        expect(this.project.find("a.name").text()).toBe(this.project_name);
      });
    });
    
    describe("moving focus to another part of the app while editing a project's name", function(){
      beforeEach(function(){
        this.project_name = "foobarbaz";
        this.project.find("a.name").dblclick();
        this.project.find("input").val(this.project_name);

        var e = jQuery.Event("blur");
        this.project.find("input").trigger(e);
      });

      it("saves the project name", function(){
        expect(this.project.find("a.name").is(":visible")).toBe(true);
        expect(this.project.find("input").is(":visible")).toBe(false);
        expect(this.project.find("a.name").text()).toBe(this.project_name);
      });
    });
  });

  describe("switching between projects", function(){
    beforeEach(function(){
      new ProjectModel({
        name: "project-a",
        projectDir: "/project-a/",
        sassDir: "/project-a/sass",
        cssDir: "/project-a/css",
        javascriptsDir: "/project-a/js",
        imagesDir: "/project-a/images"
      }).save();
      new ProjectModel({
        name: "project-b",
        projectDir: "/project-b/",
        sassDir: "/project-b/sass",
        cssDir: "/project-b/css",
        javascriptsDir: "/project-b/js",
        imagesDir: "/project-b/images"
      }).save();
      $(".projects").trigger(":changed");
    });

    context("when viewing project a and the log is selected", function() {
      beforeEach(function(){
        $(".project:contains('project-a') .source").click();
        $(".project_details:visible .mode.log").click();
      });

      it("switches to the configuration screen when switching to project b", function() {
        var project = $(".project:contains('project-b')");
        project.find(".source").click();
        var selected_project_details = $(".project_details.configure.selected[data-key=" + project.attr('data-key') + "]");
        expect(selected_project_details.length).toBe(1);
      });
    });

    context("when viewing project a and the configuration is selected", function() {
      beforeEach(function(){
        $(".project:contains('project-a') .source").click();
        $(".project_details:visible .mode.configure").click();
      });

      it("keeps the configuration selected when switching to project b", function() {
        var project = $(".project:contains('project-b')");
        project.find(".source").click();
        var visible_project_details = $(".project_details.configure[data-key=" + project.attr('data-key') + "]:visible");
        expect(visible_project_details.length).toBe(1);
      });
    });
  });

  describe("watching a project", function(){
    beforeEach(function(){
      var project_dir = air.File.createTempDirectory(),
        sass_dir = project_dir.resolvePath("sass"),
        css_dir = project_dir.resolvePath("css");
        javascripts_dir = project_dir.resolvePath("js");
        images_dir = project_dir.resolvePath("images");
      new ProjectModel({
        name: "project-a",
        projectDir: project_dir.nativePath,
        sassDir: sass_dir.nativePath,
        cssDir: css_dir.nativePath,
        javascriptsDir: javascripts_dir.nativePath,
        imagesDir: images_dir.nativePath
      }).save();
      $(".projects").trigger(":changed");
      this.project = $(".project:contains('project-a')");
    });
    
    it("displays the project's log screen by default", function(){
      var key = this.project.attr('data-key');
      // start watching the project
      this.project.find(".start").click();
      expect($(".project_details[data-key=" + key + "] .mode.log").is(":visible")).toBe(true);
    });

    describe("logged output", function(){
      it("is empty before a project is watched", function(){
        $(".project_details.selected:visible .mode.log").click();
        this.project.find(".source").click();

        var output = $(".project_details.selected:visible .log_output");
        expect(output.html().length).toBe(0);
      });

      it("is updated with text that compass sends to STDOUT", function(){
        this.project.find(".source").click();
        this.project.find(".start").click();
        $(".project_details:visible .mode.log").click();

        var output = $(".project_details .log_output:visible");
        waitsFor(function(){
          return output.html().length > 0; // should no longer be empty
        }, "Did not find expected log output", 5000);
      });
      
      it("can be cleared", function(){
        this.project.find(".source").click();
        $(".project_details.selected .mode.log").click();
        var output = $(".project_details.selected .log_output");
        output.html("foo");
        expect(output.html().length).toBeGreaterThan(0);
        $(".footer .clear_log.command").click();
        expect(output.html().length).toBe(0);
      });
    });

    context("given I have a valid project with scss files", function(){
      beforeEach(function() {

        // make the scss files to watch
        Projects.find(function (project) {
          return project.name == "project-a";
        }, function(project) {
          sassDir = new air.File(project.sassDir);
          sassDir.createDirectory();
          sassFile = sassDir.resolvePath("file.scss");
          stream = new air.FileStream();
          stream.open(sassFile, air.FileMode.WRITE);
          stream.writeUTFBytes("body { color: red; }");
          stream.close();
        });

        // start watching the project
        this.project = $(".project:contains('project-a')");
        this.project.find(".start").click();
      });
      
      describe("when I make changes to the input files", function() {
        beforeEach(function() {
          waitsFor(function(){
            var output = $(".project_details:visible .log_output");
            if(output.length === 0) return false;
            
            if(output.html().length > 0) {
              setTimeout(function(){
                Projects.find(function (project) {
                  return project.name == "project-a";
                }, function(project) {
                  sassDir = new air.File(project.sassDir);
                  sassFile = sassDir.resolvePath("file.scss");
                  stream = new air.FileStream();
                  stream.open(sassFile, air.FileMode.WRITE);
                  stream.writeUTFBytes("body { color: blue; }");
                  stream.close();
                });
              }, 1000);
              return true;
            }
            return false;
          }, "Never started logging output", 10000);
        });

        it("then I expect the output the show", function() {
          //assert that the log output has some text
          var output = $(".project_details:visible .log_output");
          waitsFor(function(){
            if(output.length === 0) return false;
            return output.html().match(/overwrite/);
          }, "Overwrite never found.", 10000);
        });
      });
    });
  });

});
