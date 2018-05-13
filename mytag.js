var Tags = {};
var Paper = {};
Tags.Paper = Paper;

Tags.Paper.TextBox = /** @class */ (function() {
    //Inherit CtagBase
    TextBox.prototype = Object.create(CTAG.CtagBase.prototype);
    //Constructor
    function TextBox(){}

    //Load method called when a bound tag,
    //needs to be rendered.
    TextBox.prototype.load = function(){

        //Registering an HTML template.
        this.register('\
            <div>\
                <div eid="paper_wrapper" class="paper-wrapper">\
                    <input eid="input" class="paper-input" type="text" />\
                    <div eid="placeholder" class="paper-placeholder"></div>\
                    <div class="paper-line"></div>\
                    <div eid="focus_line" class="paper-line paper-line-focus"></div>\
                    <div eid="error_line" class="paper-line paper-line-error"></div>\
                </div>\
            <div>\
        ');

        //Registering the fundamental styles.
        this.staticStyles("\
            this.paper-wrapper{\
                width:100%;\
                height:100%;\
                padding-bottom:2px;\
                position:relative;\
                cursor:text;\
                padding-top:20px;\
            }\
            this.paper-input{\
                font-size:14px;\
                width:100%;\
                background-color:~{paper_control_background};\
                border:none;\
                outline:none;\
                padding:5px 2px;\
                color:~{paper_font_color};\
            }\
            this.paper-placeholder{\
                position:absolute;\
                left:2px;\
                right:0;\
                bottom:7px;\
                font-size:14px;\
                transform-origin:0% 0%;\
                color:~{paper_font_color};\
                transition:transform .3s ease, color .3s ease;\
            }\
            this.paper-placeholder-up{\
                transform:translateY(-20px) scale(.8);\
                transition:transform .3s ease, color .3s ease;\
            }\
            this.paper-placeholder-focus{\
                color:~{paper_textbox_focus};\
                transition:transform .3s ease, color .3s ease;\
            }\
            this.paper-line{\
                position:absolute;\
                bottom:0;\
                left:0;\
                right:0;\
                height:2px;\
                background-color:~{paper_textbox_default};\
            }\
            this.paper-line-focus{\
                transform:scaleX(0);\
                background-color:~{paper_textbox_focus};\
                transition:transform .3s ease;\
            }\
            this.paper-line-error{\
                transform:scaleX(0);\
                background-color:~{paper_textbox_error};\
                transition:transform .3s ease;\
            }\
            this.paper-line-show{\
                transform:scaleX(1);\
                transition:transform .3s ease;\
            }\
        ");

        var inst = this;

        //Listening to events.
        this.elements.input.addEventListener("focus", function(){
            inst.elements.focus_line.classList.add("paper-line-show"); 
            inst.elements.error_line.classList.remove("paper-line-show");
            inst.elements.placeholder.classList.add("paper-placeholder-focus");
            inst.elements.placeholder.classList.add("paper-placeholder-up");
        });

        this.elements.input.addEventListener("focusout", function(){
            inst.elements.focus_line.classList.remove("paper-line-show");
            inst.elements.placeholder.classList.remove("paper-placeholder-focus");
            if (inst.value().trim() == ""){
                inst.elements.placeholder.classList.remove("paper-placeholder-up");
            }
        });

        this.elements.paper_wrapper.addEventListener("click", function(){
            inst.elements.input.focus();    
        });

        //Sets values from attributes
        this.elements.placeholder.innerHTML = this.attr("placeholder");

    };
    
    TextBox.prototype.error = function(){
        this.elements.error_line.classList.add("paper-line-show"); 
    };

    TextBox.prototype.value = function(value){
        if (value!=undefined){
            this.elements.input.value = value;
            if (value.trim()!="")
            {
                this.elements.placeholder.classList.add("paper-placeholder-up");
            }
        }
        return this.elements.input.value; 
    };

    TextBox.prototype.placeholder = function(value){
        if (value!=undefined){
            this.elements.placeholder.innerHTML = value; 
        }
        return this.elements.placeholder.innerHTML; 
    };

    return TextBox;
}()); 
 
  
document.addEventListener("CtagSetVariables", function(){
    CTAG.CtagRegistry.registerVariable("paper_control_background", "#fff");
    CTAG.CtagRegistry.registerVariable("paper_textbox_default", "#ccc");
    CTAG.CtagRegistry.registerVariable("paper_textbox_focus", "#4286f4");
    CTAG.CtagRegistry.registerVariable("paper_textbox_error", "#f44141"); 
    CTAG.CtagRegistry.registerVariable("paper_font_color", "#777");
});

document.addEventListener("CtagBind", function(){   
    CTAG.CtagRegistry.bindToTag("paper-textbox", Tags.Paper.TextBox); 
});