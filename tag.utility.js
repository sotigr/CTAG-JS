var Tags = {};
var Utility = {};
Tags.Utility = Utility;

Tags.Utility.AllCenter = /** @class */ (function() { 
    AllCenter.prototype = Object.create(CTAG.CtagBase.prototype); 
    function AllCenter(){}
 
    AllCenter.prototype.load = function(){
 
        this.register('\
        <div style="position:relative;width:100%;height:100%;overflow:hidden;">\
            <div style="display: table; position: absolute; height: 100%; width: 100%;">\
                <div style="display: table-cell; vertical-align: middle;">\
                    <div eid="content" style="margin-left: auto; margin-right: auto; width:100%;text-align:center;"></div>\
                </div>\
            </div> \
        </div>\
        '); 
        this.existingElementTarget = this.elements.content;
    };
    
 
    return AllCenter;
}()); 
   
document.addEventListener("CtagBind", function(){
    CTAG.CtagRegistry.bindToTag("all-center", Tags.Utility.AllCenter); 
});