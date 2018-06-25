"use strict";

var CTAG;
(function (CTAG) {
    
    CTAG.Settings = {};
    CTAG.Settings.asyncRegistration = false;
    CTAG.Settings.asyncCssHackRendering = false;
    CTAG.Settings.asyncChildRendering = false; 
    CTAG.Settings.asyncStyleRegistration = false;

    var CtagBase = /** @class */ (function () {
        function CtagBase() { 
            /* constructor */
        }
        CtagBase.template = "";
        CtagBase.styles = "";
        CtagBase.registered = false;
        CtagBase.stylesRegistered = false;
        CtagBase.prototype.setStyles = function(id, styles){
            DomManager.registerTargetedStyle(styles, this.tagName, id);
        };
        CtagBase.prototype.attr = function(name){
            var attr = this.body.getAttribute(name);
            if (attr == null){
                return "";
            }
            else{
                return attr;
            }
        };

        return CtagBase;
    }());
    CTAG.CtagBase = CtagBase;


    var CtagRegistry = /** @class */ (function () {
        function CtagRegistry(){} 

        CtagRegistry.tagList = {};  
        CtagRegistry.styleList = [];
        CtagRegistry.styleTargets = [];
        CtagRegistry.styleVariableList = [];
        CtagRegistry.identifiedInstances = [];
        CtagRegistry.identifiedNotifiers = []; 

        CtagRegistry.bindToTag = function (tagName, className) {
            tagName = tagName.toLowerCase();
           
            if (CtagRegistry.tagList[tagName] == undefined)
            {
                CtagRegistry.tagList[tagName] = className; 
                DomManager.monitorTag(tagName);

            }
            else
            {
                console.error("Ctag: This tag is already bound to a class.");
            }  
        }; 

        CtagRegistry.registerVariable = function(variableName, variableValue){
            CtagRegistry.styleVariableList[variableName] = variableValue;
        };

        CtagRegistry.registerId = function(id, instance){
            CtagRegistry.identifiedInstances[id] = instance;
        };

        return CtagRegistry;
    }());
    CTAG.CtagRegistry = CtagRegistry;


    var RegExExtensions = /** @class */ (function () {
        function RegExExtensions(){}  

        RegExExtensions.getMatches = function (string, regex, index) {
            index || (index = 1); // default to the first capturing group
            var matches = [];
            var match;
            while (match = regex.exec(string)) {
              matches.push(match[index]);
            }
            return matches;
        };
        
        return RegExExtensions;
    }());
    CTAG.RegExExtensions = RegExExtensions;


    var Renderer = /** @class */ (function(){
        function Renderer(){}
        
        Renderer.renderCss = function(css, tagName){
            //Targeting css to the tag specified
            var cssTargeted = css.replace(/(this\.)+/gi, tagName + " .");
                
            //Parsing the css variables and replacing them
            var variableResault = RegExExtensions.getMatches(cssTargeted, /~{([\d|\w|_]+)}/g, 1);

            //Removing variable doublicates
            function onlyUnique(value, index, self) { 
                return self.indexOf(value) === index;
            }
            variableResault = variableResault.filter(onlyUnique);

            for (var i = 0; i < variableResault.length; i++){
                if (CtagRegistry.styleVariableList[variableResault[i]]!=undefined){ 
                    cssTargeted = cssTargeted.replace(new RegExp("(~{"+variableResault[i]+"})","g"), CtagRegistry.styleVariableList[variableResault[i]]);
                }
            }
            return cssTargeted;
        };
 
        return Renderer;
    }());
    CTAG.Renderer = Renderer;
    

    var DomManager = /** @class */ (function () {
        function DomManager(){} 

        DomManager.cssHackBaseElement = null;
        DomManager.initialized = false;

        DomManager.initialize = function () { 
  
            DomManager.cssHackBaseElement = document.createElement("STYLE");
            DomManager.cssHackBaseElement.setAttribute("type", "text/css");
            DomManager.cssHackBaseElement.textContent = "@keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-moz-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-webkit-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-ms-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-o-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}";
            if (!(navigator.appName == 'Microsoft Internet Explorer' || !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1)))
            {
                document.addEventListener('animationstart', function(e){ var inst = e; DomManager.render({target:inst.target},CTAG.Settings.asyncCssHackRendering)}  , true);
                document.addEventListener('MSAnimationStart', function(e){ var inst = e; DomManager.render({target:inst.target},CTAG.Settings.asyncCssHackRendering)} , true);
                document.addEventListener('webkitAnimationStart', function(e){ var inst = e; DomManager.render({target:inst.target},CTAG.Settings.asyncCssHackRendering)} , true);
            }
               
     
            document.head.appendChild(DomManager.cssHackBaseElement);
       
        };

        DomManager.render = function(event, async){ 
            return new Promise(function(success, fali){ 
                                  
                var tagClass = CtagRegistry.tagList[event.target.tagName.toLowerCase()];  
                               
                if (tagClass != undefined && event.target.getAttribute("ctag-rendered")==null){ 
                   
                   
                    var instance = new tagClass();
                    instance.tagName = event.target.tagName.toLowerCase() ; 
                    var tempHtml = event.target.innerHTML;  
                    event.target.textContent = "";
                    instance.body = event.target; 
                    instance.children = {};
            
                    if (!tagClass.registered)
                    {
                        tagClass.registered = true;
                        var parser = new TemplateTranspiler.Parser();
                        parser.GenerateDrawerFuction(event.target.tagName, tagClass.template); 
                    }
                    if (!tagClass.stylesRegistered)
                    {
                        tagClass.stylesRegistered= true;
                        DomManager.registerStyle(tagClass.styles, event.target.tagName);
                    }
                    TemplateTranspiler.Functions[event.target.tagName](instance.body, async).then(function(objects){
                        instance.elements = objects;  
                        
                        //rendering chlildren
                        var promiseList = [];

                        //Searching for tag matches
                        var childTags = Object.keys(CtagRegistry.tagList);
                        
                        for(var i = 0; i< childTags.length; i++){
                            var tagList = instance.body.querySelectorAll(childTags[i]);
                            for(var tag = 0; tag < tagList.length; tag ++){  
                                promiseList.push(DomManager.render({target:tagList[tag]}, CTAG.Settings.asyncChildRendering)); 
                            }
                        }
                        Promise.all(promiseList).then(function(chlidObjects){ 
                            var elem = instance.existingElementTarget;
                            if (elem!=undefined)
                            {
                                elem.innerHTML = tempHtml;
                            
                                var objkeys = Object.keys(CtagRegistry.tagList);
                                for (var i=0;i<objkeys.length; i++)
                                { 
                                    var qr = elem.querySelectorAll(objkeys[i]); 
                                    for (var j=0;j<qr.length;j++)
                                    {   
                                        chlidObjects.concat(DomManager.render({target:qr[j]}, false));
                                    }                                    
                                }
                            }


                            for (var i = 0; i<chlidObjects.length; i++)
                            { 
                                if (chlidObjects[i].body.getAttribute("eid")!=null)
                                { 
                                    instance.children[chlidObjects[i].body.getAttribute("eid")] = chlidObjects[i];
                                }
                            }
                         
                            instance.load(); 
                     
                            var objId = event.target.getAttribute("id"); 
                            if (objId != null){
                                CtagRegistry.registerId(objId, instance);
                                if (CtagRegistry.identifiedNotifiers[objId]!=undefined)
                                {  
                                    CtagRegistry.identifiedNotifiers[objId](instance);
                                }
                            } 

                            //Transfers attributes because (Attribute on custom tags are normaly discarded).
                            for(var i = 0; i < event.target.attributes.length; i++)
                            { 
                                event.target.children[0].setAttribute(event.target.attributes[i].name, event.target.attributes[i].value);
                            }  

                            event.target.setAttribute("ctag-rendered", "true");
                            success(instance); 
                        });  
                    });  
                } 
                else
                {
                    success(null);
                } 
            });
        };

       
         
        DomManager.registerStyle = function(css, tagName){ 
            return new Promise(function(resolve, fail){
                var _regstyles = function (){
                    if (CtagRegistry.styleList[tagName]==undefined){ 
                        var cssTargeted = Renderer.renderCss(css, tagName);
                        
                        //Updating the registry and adding to DOM
                        CtagRegistry.styleList[tagName] = cssTargeted;
                        var styleElement = document.createElement("STYLE");
                        styleElement.textContent = cssTargeted;
                        
                        document.head.appendChild(styleElement); 
                    }
                };
                if (CTAG.Settings.asyncStyleRegistration){
                    setTimeout(function(){
                        _regstyles();
                        resolve();
                    },0);
                }
                else{
                    _regstyles();
                    resolve();
                }
                
            });
        };

        DomManager.registerTargetedStyle = function(css, tagName, id){ 
            var cssTargeted = Renderer.renderCss(css, tagName);
            if (CtagRegistry.styleTargets[tagName + "_" + id]==undefined){
                
                //Updating the registry and adding to DOM
                var styleElement = document.createElement("STYLE");
                styleElement.textContent = cssTargeted;
                CtagRegistry.styleTargets[tagName + "_" + id] = styleElement;
                
                document.head.appendChild(styleElement); 
            }
            else
            {
                var styleElement = CtagRegistry.styleTargets[tagName + "_" + id];
                styleElement.textContent = cssTargeted; 
            }
        };

        DomManager.monitorTag = function(tagName){
            DomManager.cssHackBaseElement.textContent += tagName + "{animation-duration:0.01s;-o-animation-duration:0.01s;-ms-animation-duration:0.01s;-moz-animation-duration:0.01s;-webkit-animation-duration:0.01s;animation-name:nodeInserted;-o-animation-name:nodeInserted;-ms-animation-name:nodeInserted;-moz-animation-name:nodeInserted;-webkit-animation-name:nodeInserted}";
        };
        
        DomManager.getById = function(id, callback){ 
            return CtagRegistry.identifiedInstances[id];
        };

        DomManager.ctagLoaded = function(id){
            return new Promise(function(success, fail){
                CtagRegistry.identifiedNotifiers[id] = success; 
            });
        };

        return DomManager;
    }());
    CTAG.DomManager = DomManager;


})(CTAG || (CTAG = {})); 


document.addEventListener("DOMContentLoaded",function(){

    CTAG.DomManager.initialize();  
   
    var ctagSetVariableEvent = document.createEvent("Event");
    ctagSetVariableEvent.initEvent("CtagSetVariables", false, true); 
    document.dispatchEvent(ctagSetVariableEvent);
    
  
    var ctagBindEvent = document.createEvent("Event");
    ctagBindEvent.initEvent("CtagBind", true, true);  
    document.dispatchEvent(ctagBindEvent);
     
    var keys = Object.keys(CTAG.CtagRegistry.tagList);
    
    for (var i = 0; i < keys.length; i++)
    {  
        var tagNodes = document.querySelectorAll(keys[i]);
        for (var j = 0; j < tagNodes.length; j++)
        {   
            var instn = tagNodes[j];
            CTAG.DomManager.render({target:instn}, CTAG.Settings.asyncRegistration);
        }  
    }

    if (navigator.appName == 'Microsoft Internet Explorer' || !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1))
    {
        document.addEventListener('animationstart', function(e){ var inst = e; DomManager.render({target:inst.target},CTAG.Settings.asyncCssHackRendering)}  , true);
        document.addEventListener('MSAnimationStart', function(e){ var inst = e; DomManager.render({target:inst.target},CTAG.Settings.asyncCssHackRendering)} , true);
        document.addEventListener('webkitAnimationStart', function(e){ var inst = e; DomManager.render({target:inst.target},CTAG.Settings.asyncCssHackRendering)} , true);
    }

    var ctagReadyEvent = document.createEvent("Event");
    ctagReadyEvent.initEvent("CtagReady", false, true);  
    document.dispatchEvent(ctagReadyEvent); 
 
});