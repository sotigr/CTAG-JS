
document.addEventListener("CtagSetVariables", function(){
    CTAG.CtagRegistry.registerVariable("paper_control_background", "#fff");
    CTAG.CtagRegistry.registerVariable("paper_textbox_default", "#ccc");
    CTAG.CtagRegistry.registerVariable("paper_textbox_focus", "#4286f4");
    CTAG.CtagRegistry.registerVariable("paper_textbox_error", "#f44141"); 
    CTAG.CtagRegistry.registerVariable("paper_font_color", "#777");
    CTAG.CtagRegistry.registerVariable("paper_button_background_normal", "#4286f4");
    CTAG.CtagRegistry.registerVariable("paper_button_background_hover", "#4286f4"); 
    CTAG.CtagRegistry.registerVariable("paper_button_circle", "#173566");
    CTAG.CtagRegistry.registerVariable("paper_button_font_color_normal", "#efefef");
    CTAG.CtagRegistry.registerVariable("paper_button_font_color_hover", "#efefef");
});

var Controls = {};
var Paper = {};
Controls.Paper = Paper;

Controls.Paper.TextBox = /** @class */ (function() {
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
 

Controls.Paper.Button = /** @class */ (function() {
    //Inherit CtagBase
    Button.prototype = Object.create(CTAG.CtagBase.prototype);
    //Constructor
    function Button(){}

    //Load method called when a bound tag,
    //needs to be rendered.
    Button.prototype.load = function(){

        //Registering an HTML template.
        if (this.attr("size") == "auto"){

            this.register('\
                <div>\
                    <div eid="wrapper" class="wrapper">\
                        <div eid="circle" class="circle"></div>\
                        <div class="paddings">\
                            <div eid="textValue"></div>\
                        </div>\
                    </div>\
                <div>\
            ');
        }
        else
        {
            this.register('\
                <div>\
                    <div eid="wrapper" class="wrapper">\
                        <div eid="circle" class="circle"></div>\
                        <all-center>\
                            <div eid="textValue"></div>\
                        </all-center>\
                    </div>\
                <div>\
            ');
        }
        //Registering the fundamental styles.
        this.staticStyles("\
            this.wrapper{\
                position:relative;\
                overflow:hidden;\
                background-color:~{paper_button_background_normal};\
                color:~{paper_button_font_color_normal};\
                border-radius:3px;\
                cursor:pointer;\
                font-size:16px;\
                box-shadow:0px 2px 2px rgba(0,0,0,.3);\
                transition:color .3s ease, background-color .3s ease, box-shadow .3s ease;\
                -webkit-user-select: none;\
                -khtml-user-select: none;\
                -moz-user-select: none;\
                -o-user-select: none;\
                user-select: none;\
                width:100%;\
                height:100%;\
            }\
            this.wrapper_autosize{\
                display:inline-block;\
                width:auto;\
                height:auto;\
            }\
            this.paddings{\
                position:relative;\
                z-index:1;\
                padding:5px 30px;\
            }\
            this.wrapper:hover{\
                background-color:~{paper_button_background_hover};\
                color:~{paper_button_font_color_hover};\
                transition:color .3s ease, background-color .3s ease, box-shadow .3s ease;\
            }\
            this.wrapper-pressed{\
                box-shadow:0px 5px 10px rgba(0,0,0,.3);\
                transition:color .3s ease, background-color .3s ease, box-shadow 0s ease;\
            }\
            this.circle{\
                position:absolute;\
                top:0;left:0;width:200px;height:200px;\
                margin-left:-100px; margin-top:-100px;\
                border-radius:100%;\
                background-color:~{paper_button_circle};\
                opacity:.5;\
                transform:scale(0);\
                transition:transform 0s linear;\
            }\
            this.circle-expand{\
                transition:transform .3s ease, opacity 1s ease;\
                transform:scale(1);\
                opacity:0;\
            }\
        ");
        if(this.attr("size") == "auto")
        {
            this.elements.wrapper.classList.add("wrapper_autosize");
        }
        var inst = this;
        this.elements.wrapper.addEventListener("mousedown", function(event){
            var cancel_removal = true;
            inst.elements.circle.classList.remove("circle-expand"); 
            inst.elements.circle.style.left = event.clientX-this.offsetLeft + "px";  
            inst.elements.circle.style.top = window.pageYOffset + event.clientY-this.offsetTop + "px";   

            inst.elements.circle.classList.add("circle-expand");
            
            setTimeout(function(){
                if (!cancel_removal)
                    inst.elements.circle.classList.remove("circle-expand"); 
                cancel_removal =false;
            }, 1000);
            this.classList.add("wrapper-pressed");
        }); 
        this.elements.wrapper.addEventListener("mouseup", function(){
            this.classList.remove("wrapper-pressed"); 
        });
        this.elements.wrapper.addEventListener("mouseleave", function(){
            this.classList.remove("wrapper-pressed");  
        });
        this.elements.wrapper.setAttribute("tabindex", "0");
        this.elements.textValue.innerHTML = this.attr("value"); 
    };
  
    Button.prototype.value = function(value){
        if (value!=undefined){
            this.elements.input.value = value;
            if (value.trim()!="")
            {
                this.elements.placeholder.classList.add("paper-placeholder-up");
            }
        }
        return this.elements.input.value; 
    };

    Button.prototype.placeholder = function(value){
        if (value!=undefined){
            this.elements.placeholder.innerHTML = value; 
        }
        return this.elements.placeholder.innerHTML; 
    };

    return Button;
}()); 



document.addEventListener("CtagBind", function(){   
    CTAG.CtagRegistry.bindToTag("paper-textbox", Controls.Paper.TextBox); 
    CTAG.CtagRegistry.bindToTag("paper-button", Controls.Paper.Button); 
});