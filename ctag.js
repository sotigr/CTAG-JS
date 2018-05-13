var CTAG;
(function (CTAG) {
 

    var CtagBase = /** @class */ (function () {
        function CtagBase() { 
            /* constructor */
            this.body = undefined;
            this.existingElementTarget = this.body;
        }
        
        CtagBase.prototype.register = function (template) { 
            this.body.innerHTML = template; 
            this.instances = DomManager.renderChildren(this.body);
            var elements = this.body.querySelectorAll("[eid]"); 
            this.elements = {};
            for (var i = 0; i < elements.length; i++)
            {  
                this.elements[elements[i].getAttribute("eid")] = elements[i];
            }
        };

        CtagBase.prototype.staticStyles = function (css) { 
            DomManager.registerStyle(css, (this.tagName!=undefined)?this.tagName:this.cssClassName);
        };
  
        CtagBase.prototype.styles = function (id, css) { 
            DomManager.registerTargetedStyle(css, (this.tagName!=undefined)?this.tagName:this.cssClassName, id);
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

        CtagRegistry.tagList = []; 
        CtagRegistry.cssClassList = []; 
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

                //Rendering preregistered nodes
                var tagNodes = document.querySelectorAll(tagName); 
                for (var i = 0; i < tagNodes.length; i++)
                { 
                    DomManager.render({target:tagNodes[i]});
                }
            }
            else
            {
                console.error("Ctag: This tag is already bound to a class.");
            }  
        };

        CtagRegistry.bindToClass = function (cssClass, className) {
            if (CtagRegistry.cssClassList[cssClass] == undefined)
            {
                CtagRegistry.cssClassList[cssClass] = className; 
                DomManager.monitorClass(cssClass);

                //Rendering preregistered nodes
                var cssClassNodes = document.querySelectorAll("." + cssClass);
                 
                for (var i = 0; i < cssClassNodes.length; i++)
                { 
                    DomManager.render({target:cssClassNodes[i]});
                }
            }
            else
            {
                console.error("Ctag: This css class is already bound to a class.");
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
            if (!DomManager.initialized){DomManager.initialized=true;}else{return;}
            DomManager.cssHackBaseElement = document.createElement("STYLE");
            DomManager.cssHackBaseElement.setAttribute("type", "text/css");
            DomManager.cssHackBaseElement.innerHTML = "@keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-moz-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-webkit-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-ms-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}@-o-keyframes nodeInserted{from{outline-color:#fff}to{outline-color:#000}}";
            
            document.addEventListener('animationstart', DomManager.render , true);
            document.addEventListener('MSAnimationStart', DomManager.render, true);
            document.addEventListener('webkitAnimationStart', DomManager.render, true);

            document.head.appendChild(DomManager.cssHackBaseElement);
 
        };

        DomManager.render = function(event){ 
            var tagClass = undefined;
            var bindType = undefined;
            if (CtagRegistry.tagList[event.target.tagName.toLowerCase()]!=undefined){
                tagClass =  CtagRegistry.tagList[event.target.tagName.toLowerCase()];
                bindType="tag";
            }
            else{
                tagClass = CtagRegistry.cssClassList[event.target.classList[0].toLowerCase()];
                bindType="class"
            }
            if (tagClass != undefined && event.target.getAttribute("ctag-rendered")==null){ 
                var instance = new tagClass();
                instance.tagName = (bindType=="tag")? event.target.tagName.toLowerCase() : undefined;
                instance.cssClassName = (bindType=="class")? "." + event.target.classList[0].toLowerCase() : undefined; 
                instance.body = event.target;
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
                return instance;
            } 
            else
            {
                return null;
            }
        };

        DomManager.renderChildren = function(element){
            var childList = {};
            //Searching for tag matches
            for(var i = 0; i < CtagRegistry.tagList.length; i ++){
                var tagList = element.querySelectorAll(CtagRegistry.tagList[i]);
                for(var tag = 0; tag < tagList.length; tag ++){
                    
                    var instance = DomManager.render({target:tagList[tag]});
                    if (tagList[tag].getAttribute("eid")!=null)
                    {
                        childList[tagList[tag].getAttribute("eid")] = instance;
                    }
                }
            }
            
            //Searching for css-class matches
            for(var i = 0; i < CtagRegistry.cssClassList.length; i ++){
                var cssClassList = element.querySelectorAll(CtagRegistry.cssClassList[i]);
                for(var classIndex = 0; classIndex < cssClassList.length; classIndex ++){
                    var instance = DomManager.render({target:cssClassList["." + classIndex]});
                    if (tagList[tag].getAttribute("eid")!=null)
                    {
                        childList[tagList[tag].getAttribute("eid")] = instance;
                    }
                }
            }
            return childList;
        };
         
        DomManager.registerStyle = function(css, tagName){
            if (CtagRegistry.styleList[tagName]==undefined){ 
                var cssTargeted = Renderer.renderCss(css, tagName);
                
                //Updating the registry and adding to DOM
                CtagRegistry.styleList[tagName] = cssTargeted;
                var styleElement = document.createElement("STYLE");
                styleElement.innerHTML = cssTargeted;
                
                document.head.appendChild(styleElement); 
            }
        };

        DomManager.registerTargetedStyle = function(css, tagName, id){ 
            var cssTargeted = Renderer.renderCss(css, tagName);
            if (CtagRegistry.styleTargets[tagName + "_" + id]==undefined){
                
                //Updating the registry and adding to DOM
                var styleElement = document.createElement("STYLE");
                styleElement.innerHTML = cssTargeted;
                CtagRegistry.styleTargets[tagName + "_" + id] = styleElement;
                
                document.head.appendChild(styleElement); 
            }
            else
            {
                var styleElement = CtagRegistry.styleTargets[tagName + "_" + id];
                styleElement.innerHTML = cssTargeted; 
            }
        };

        DomManager.monitorTag = function(tagName){
            DomManager.cssHackBaseElement.innerHTML += tagName + "{animation-duration:0.01s;-o-animation-duration:0.01s;-ms-animation-duration:0.01s;-moz-animation-duration:0.01s;-webkit-animation-duration:0.01s;animation-name:nodeInserted;-o-animation-name:nodeInserted;-ms-animation-name:nodeInserted;-moz-animation-name:nodeInserted;-webkit-animation-name:nodeInserted}";
        };
        
        DomManager.monitorClass = function(className){
            DomManager.cssHackBaseElement.innerHTML += "." + className + "{animation-duration:0.01s;-o-animation-duration:0.01s;-ms-animation-duration:0.01s;-moz-animation-duration:0.01s;-webkit-animation-duration:0.01s;animation-name:nodeInserted;-o-animation-name:nodeInserted;-ms-animation-name:nodeInserted;-moz-animation-name:nodeInserted;-webkit-animation-name:nodeInserted}";
        };

        DomManager.getById = function(id, callback){ 
            return CtagRegistry.identifiedInstances[id];
        };

        DomManager.setLoadNotify = function(id, callback){
            CtagRegistry.identifiedNotifiers[id] = callback; 
        };

        return DomManager;
    }());
    CTAG.DomManager = DomManager;


})(CTAG || (CTAG = {})); 

CTAG.DomManager.initialize();  

document.addEventListener("DOMContentLoaded",function(){
   
    var ctagSetVariableEvent = document.createEvent("Event");
    ctagSetVariableEvent.initEvent("CtagSetVariables", false, true); 
    document.dispatchEvent(ctagSetVariableEvent);
    
    var ctagBindEvent = document.createEvent("Event");
    ctagBindEvent.initEvent("CtagBind", false, true);  
    document.dispatchEvent(ctagBindEvent);

    var ctagReadyEvent = document.createEvent("Event");
    ctagReadyEvent.initEvent("CtagReady", false, true);  
    document.dispatchEvent(ctagReadyEvent);
    
});