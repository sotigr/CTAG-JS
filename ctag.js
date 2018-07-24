"use strict";

var CTAG;
(function (CTAG) {

    CTAG.Settings = {};
    CTAG.Settings.asyncRegistration = false; 
    CTAG.Settings.asyncChildRendering = false;
    CTAG.Settings.asyncStyleRegistration = true;

    var CtagBase = /** @class */function () {
        function CtagBase() {
            /* constructor */
        }
        CtagBase.template = "";
        CtagBase.styles = "";
        CtagBase.registered = false;
        CtagBase.stylesRegistered = false;
        CtagBase.prototype.setStyles = function (id, styles) {
            DomManager.registerTargetedStyle(styles, this.tagName, id);
        };
        CtagBase.prototype.attr = function (name) {
            var attr = this.body.getAttribute(name);
            if (attr == null) {
                return "";
            } else {
                return attr;
            }
        };
        CtagBase.prototype.addChild = function (template, host) {
            var _this = this;
            return new Promise(function (success) {
                var chlid_temp = document.createElement("DIV");
                chlid_temp.innerHTML = template;
                var unrendered = chlid_temp.children[0];
                host.appendChild(unrendered);
                CTAG.DomManager.render({ target: unrendered }, false).then(function (instance) {
                    if (unrendered.getAttribute("eid") != null) _this.children[unrendered.getAttribute("eid")] = instance;
                    success();
                });
            });
        };
        CtagBase.prototype.addElement = function (template, host) {
            var _this = this;
            return new Promise(function (success) {
                var chlid_temp = document.createElement("DIV");
                chlid_temp.innerHTML = template;
                var element = chlid_temp.children[0];
                if (element.getAttribute("eid") != null) _this.elements[element.getAttribute("eid")] = element;
                host.appendChild(element);
                success();
            });
        };
        return CtagBase;
    }();
    CTAG.CtagBase = CtagBase;

    var CtagRegistry = /** @class */function () {
        function CtagRegistry() {}

        CtagRegistry.tagList = {};
        CtagRegistry.styleList = [];
        CtagRegistry.styleTargets = [];
        CtagRegistry.styleVariableList = [];
        CtagRegistry.identifiedInstances = [];
        CtagRegistry.identifiedNotifiers = [];
        CtagRegistry.Instances = [];
        CtagRegistry.InstanceIndex = 0;

        CtagRegistry.bindToTag = function (tagName, className) {
            tagName = tagName.toLowerCase();

            if (CtagRegistry.tagList[tagName] == undefined) {
                CtagRegistry.tagList[tagName] = className;
            } else {
                console.error("Ctag: This tag is already bound to a class.");
            }
        };

        CtagRegistry.registerVariable = function (variableName, variableValue) {
            CtagRegistry.styleVariableList[variableName] = variableValue;
        };

        CtagRegistry.registerId = function (id, instance) {
            CtagRegistry.identifiedInstances[id] = instance;
        };

        return CtagRegistry;
    }();
    CTAG.CtagRegistry = CtagRegistry;

    var RegExExtensions = /** @class */function () {
        function RegExExtensions() {}

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
    }();
    CTAG.RegExExtensions = RegExExtensions;

    var Renderer = /** @class */function () {
        function Renderer() {}

        Renderer.renderCss = function (css, tagName) {
            //Targeting css to the tag specified
            var cssTargeted = css.replace(/(this\.)+/gi, tagName + " .");

            //Parsing the css variables and replacing them
            var variableResault = RegExExtensions.getMatches(cssTargeted, /~{([\d|\w|_]+)}/g, 1);

            //Removing variable doublicates
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }
            variableResault = variableResault.filter(onlyUnique);

            for (var i = 0; i < variableResault.length; i++) {
                if (CtagRegistry.styleVariableList[variableResault[i]] != undefined) {
                    cssTargeted = cssTargeted.replace(new RegExp("(~{" + variableResault[i] + "})", "g"), CtagRegistry.styleVariableList[variableResault[i]]);
                }
            }
            return cssTargeted;
        };

        return Renderer;
    }();
    CTAG.Renderer = Renderer;

    var DomManager = /** @class */function () {
        function DomManager() {}

        DomManager.render = function (event, async) {
            return new Promise(function (success, fail) {
                
                var rawElement = event.target;
                var tempDisplay = rawElement.style.display;
                rawElement.style.display = "none";
                var tagClass = CtagRegistry.tagList[rawElement.tagName.toLowerCase()];
                if (rawElement.getAttribute("ctag-iid") != null) {
                    success(CtagRegistry.Instances[parseInt(rawElement.getAttribute("ctag-iid"))]);
                    return;
                }
                if (tagClass != undefined && rawElement.getAttribute("ctag-rendered") == null) {
                    rawElement.setAttribute("ctag-rendered", "true");
                    CtagRegistry.InstanceIndex += 1;
                    var myiid = CtagRegistry.InstanceIndex;
                    rawElement.setAttribute("ctag-iid", myiid);
                    var instance = new tagClass();
                    CtagRegistry.Instances[myiid] = instance;
                    instance.tagName = rawElement.tagName.toLowerCase();
                    var tempHtml = rawElement.innerHTML;
                    rawElement.textContent = "";
                    instance.body = rawElement;
                    instance.children = {};

                    if (!tagClass.registered) {
                        tagClass.registered = true;
                        var parser = new TemplateTranspiler.Parser();
                        parser.GenerateDrawerFuction(rawElement.tagName, tagClass.template);
                    }
                    if (!tagClass.stylesRegistered) {
                        tagClass.stylesRegistered = true;
                        DomManager.registerStyle(tagClass.styles, rawElement.tagName);
                    }
                    TemplateTranspiler.Functions[rawElement.tagName](instance.body, async).then(function (objects) {
                        instance.elements = objects;

                        //rendering chlildren
                        var promiseList = [];
                        //Searching for tag matches
                        var childTags = Object.keys(CtagRegistry.tagList);

                        for (var i = 0; i < childTags.length; i++) {
                            var tagList = instance.body.querySelectorAll(childTags[i]);
                            for (var tag = 0; tag < tagList.length; tag++) {
                                promiseList.push(DomManager.render({ target: tagList[tag] }, CTAG.Settings.asyncChildRendering));
                            }
                        }

                        Promise.all(promiseList).then(function (chlidObjects) {
                            var rawEids = instance.body.querySelectorAll("[eid]");

                            var elem = instance.existingElementTarget;
                            instance.children = chlidObjects;

                            if (elem != undefined) {
                                elem.innerHTML = tempHtml;
                                var neweids = elem.querySelectorAll("[eid]");
                                for (var i = 0; i < neweids.length; i++) {
                                    instance.elements[neweids[i].getAttribute("eid")] = neweids[i];
                                }
                                var objkeys = Object.keys(CtagRegistry.tagList);
                                for (var i = 0; i < objkeys.length; i++) {
                                    var qr = elem.querySelectorAll(objkeys[i]);
                                    for (var j = 0; j < qr.length; j++) {
                                        chlidObjects.concat(DomManager.render({ target: qr[j] }, false));
                                    }
                                }
                            }

                            var promList = [];
                            for (var i = 0; i < chlidObjects.length; i++) {
                                var obj = chlidObjects[i];
                                promList.push(new Promise(function (succ) {
                                    if (obj != null) {
                                        if (obj.body.getAttribute("eid") != null) {
                                            instance.children[obj.body.getAttribute("eid")] = obj;
                                        }

                                        if (Object.keys(obj.children).length > 0 || Object.keys(obj.elements).length > 0) {
                                            for (var j = 0; j < rawEids.length; j++) {
                                                var ceid = rawEids[j].getAttribute("eid");

                                                if (obj.children[ceid] != undefined) {
                                                    instance.children[ceid] = obj.children[ceid];
                                                }
                                                if (obj.elements[ceid] != undefined) {
                                                    instance.elements[ceid] = obj.elements[ceid];
                                                }
                                            }
                                        }
                                    }
                                    succ();
                                }));
                            }
                            Promise.all(promList).then(function () {
                                instance.load();

                                var objId = rawElement.getAttribute("id");
                                if (objId != null) {
                                    CtagRegistry.registerId(objId, instance);
                                    if (CtagRegistry.identifiedNotifiers[objId] != undefined) {
                                        CtagRegistry.identifiedNotifiers[objId](instance);
                                    }
                                }
                                rawElement.style.display = tempDisplay;
                                //Transfers attributes because (Attribute on custom tags are normaly discarded).
                                for (var i = 0; i < rawElement.attributes.length; i++) {
                                    if (rawElement.children[0] != undefined) {
                                        rawElement.children[0].setAttribute(rawElement.attributes[i].name, rawElement.attributes[i].value);
                                    }
                                } 
                                
                                success(instance);
                            });
                        });
                    });
                } else {
                    success(null);
                }

            });
        };

        DomManager.registerStyle = function (css, tagName) {
            return new Promise(function (resolve, fail) {
                var _regstyles = function _regstyles() {
                    if (CtagRegistry.styleList[tagName] == undefined) {
                        var cssTargeted = Renderer.renderCss(css, tagName);

                        //Updating the registry and adding to DOM
                        CtagRegistry.styleList[tagName] = cssTargeted;
                        var styleElement = document.createElement("STYLE");
                        styleElement.textContent = cssTargeted;

                        document.head.appendChild(styleElement);
                    }
                };
                if (CTAG.Settings.asyncStyleRegistration) { 
                    new Promise(function(s){
                        _regstyles();
                        resolve();
                        s(); 
                    });
                } else {
                    _regstyles();
                    resolve();
                }
            });
        };

        DomManager.registerTargetedStyle = function (css, tagName, id) {
            var cssTargeted = Renderer.renderCss(css, tagName);
            if (CtagRegistry.styleTargets[tagName + "_" + id] == undefined) {

                //Updating the registry and adding to DOM
                var styleElement = document.createElement("STYLE");
                styleElement.textContent = cssTargeted;
                CtagRegistry.styleTargets[tagName + "_" + id] = styleElement;

                document.head.appendChild(styleElement);
            } else {
                var styleElement = CtagRegistry.styleTargets[tagName + "_" + id];
                styleElement.textContent = cssTargeted;
            }
        };

        DomManager.getById = function (id, callback) {
            return CtagRegistry.identifiedInstances[id];
        };

        DomManager.ctagLoaded = function (id) {
            return new Promise(function (success, fail) {
                CtagRegistry.identifiedNotifiers[id] = success;
            });
        };

        return DomManager;
    }();
    CTAG.DomManager = DomManager;
})(CTAG || (CTAG = {}));

document.addEventListener("DOMContentLoaded", function () {

    var ctagSetVariableEvent = document.createEvent("Event");
    ctagSetVariableEvent.initEvent("CtagSetVariables", false, true);
    document.dispatchEvent(ctagSetVariableEvent);

    var ctagBindEvent = document.createEvent("Event");
    ctagBindEvent.initEvent("CtagBind", true, true);
    document.dispatchEvent(ctagBindEvent);

    var keys = Object.keys(CTAG.CtagRegistry.tagList);
    var tagNodes = [];
    for (var i = 0; i < keys.length; i++) {
        var nodes = document.querySelectorAll(keys[i]);
        for (var k = 0; k < nodes.length; k++) {
            tagNodes.push(nodes[k]);
        }
    }
    for (var j = 0; j < tagNodes.length; j++) {
        var instn = tagNodes[j]; 
        CTAG.DomManager.render({ target: instn }, CTAG.Settings.asyncRegistration);
    }

    var ctagReadyEvent = document.createEvent("Event");
    ctagReadyEvent.initEvent("CtagReady", false, true);
    document.dispatchEvent(ctagReadyEvent);
});