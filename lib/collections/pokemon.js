Pokemon = new Mongo.Collection('pokemon');

Pokemon.attachSchema(new SimpleSchema({
  name: {
    type: String,
    label: "Name"
  },
  description: {
    type: String,
    label: "Description"
  },
  image_url: {
    type: String,
    label: "Image URL"
  }
}));

Meteor.methods({
  'pokemon/generate_pdf': function() {
    if(Meteor.isServer){

      //setup
      var webshot = Meteor.npmRequire('webshot');
      var fs = Npm.require('fs');
      var Future = Npm.require('fibers/future');

      var fut = new Future();
      var fileName = "pokemon-report.pdf";

      //generate the html string
      var css = Assets.getText('style.css');

      SSR.compileTemplate('layout', Assets.getText('layout.html'));

      Template.layout.helpers({
        getDocType: function() {
          return "<!DOCTYPE>";
        }
      });

      SSR.compileTemplate('pokemon_report', Assets.getText('pokemon-report.html'));

      //prepare data
      var pokemon = Pokemon.find({});
      var data = {
        pokemon: pokemon
      }

      var html_string = SSR.render('layout', {
        css: css,
        template: "pokemon_report",
        data: data
      });

      var options = {
        "paperSize": {
          "format": "Letter",
          "orientation": "portrait",
          "margin": "1cm"
        },
        siteType: 'html'
      };

      console.log("Commencing webshot.....");

      webshot(html_string, fileName, options, function(err) {
        fs.readFile(fileName, function (err, data) {
          if(err) {
            return console.log(err);
          }

          fs.unlinkSync(fileName);
          fut.return(data);

        });
      });

      let pdfData = fut.wait();
      let base64String = new Buffer(pdfData).toString('base64');

      return base64String;
    }
  }
});
