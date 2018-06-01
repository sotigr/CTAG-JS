"use strict";

var TemplateTranspiler = {};
TemplateTranspiler.Functions = {};
TemplateTranspiler.UID  = (function(){
    function UID() {};

    //Generates a random id
    UID.Generate = function() {
        function s4() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
          
            for (var i = 0; i < 5; i++)
              text += possible.charAt(Math.floor(Math.random() * possible.length));
          
            return text;
        }
        return s4() + s4() + '_' + s4() + '_' + s4() + '_' + s4() + '_' + s4() + s4() + s4();
    };

    return UID;
}());
 
TemplateTranspiler.Parser = (function(){
    function Parser(){
        //The dom parser is used to read the input template
        this._domParser = new DOMParser();
        
        //Creates a random nameset for all elements parsed by each instance
        //to avoid possible conflicts
        this._random_name = TemplateTranspiler.UID.Generate();

        //tag_count is the unique identifier for each tag parsed by each instance
        this._tag_count = 0;
    }
    Parser.prototype.TemplateInstanceList = [];
    Parser.prototype.TranspileNode = function(node, parentName){
        //Generating a unique name for the element
        var current_name = "a_" + this._random_name + "_" + this._tag_count++;

        //Initializing a viriable for the generated code
        var final = "";
        
     
        if (node.nodeName == "#text"){
            if (node.data.replace(/[\r\n]+/g,' ').trim() == "")
                return "";
            final += "var " + current_name + " = " + "document.createElement('SPAN');";
            final += current_name + ".innerHTML += '"+ node.data.replace(/[\r\n]+/g,' ') + "';";
            final +=  parentName + ".appendChild("+current_name+");";  
            return final;
        }
        //Creates the element
        final += "var " + current_name + " = " + "document.createElement('"+node.tagName.toUpperCase()+"');";
    
        //Parsing and transfering arguments
        for(var i = 0; i < node.attributes.length; i++)
        {
            final += current_name + ".setAttribute('"+node.attributes[i].name+"', '"+node.attributes[i].value+"');"
        }
  
        //Parsing children if any
        if (node.childNodes.length > 0)
        {
            for (var i = 0; i < node.childNodes.length; i++)
            { 
                final += this.TranspileNode(node.childNodes[i], current_name);
            } 
        }
        else{ 
            //If there are no children then add the innerHTML
           
            final += current_name + ".textContent = '" + node.innerHTML.replace(/[\r\n]+/g,' ') + "';";
        }

        //Append to parent
        if (node.hasAttribute("eid"))
        { 
            final += parentName + ".appendChild("+current_name+");"; 
            final += "childObjects." + node.getAttribute("eid") + " = " + current_name + ";";
        }
        else
        { 
            final +=  parentName + ".appendChild("+current_name+");";  
        }
 
        //return the generated javascript for this node
        return final;
    };

    Parser.prototype.Parse = function(template){
        //Cleans the instance list
        this.TemplateInstanceList = [];

        //Feeds the template in the dom parser.
        var parsedTemplate = this._domParser.parseFromString(template, "text/html"); 

        var transpiled = "";
        for (var i = 0; i < parsedTemplate.body.childNodes.length; i++)
        {
            //generating the javascript code for each child
            //of the root of the document
            transpiled += this.TranspileNode(parsedTemplate.body.childNodes[i], "target");
        } 
        
        return transpiled;
    };

    Parser.prototype.GenerateDrawerFuction = function(functionName, template){
        var final = "TemplateTranspiler.Functions." + functionName + " = function(target, async){";
        final += "return new Promise(function(resolve, reject){"; 
        final += "if (async!=false){";
        final += "window.setTimeout(function(){"
        final += "var childObjects = {};"
        final += this.Parse(template);
        final += "resolve(childObjects);"; 
        final += "},0);";
        final += "}else{";
        final += "var childObjects = {};"
        final += this.Parse(template);
        final += "resolve(childObjects);"; 
        final += "}";
        final += "});";
        final += "};";
        var script = document.createElement("SCRIPT");
        script.innerHTML = final;
        document.head.appendChild(script); 
    };

    return Parser;
}());