package ui;
import jQuery.JQuery;
import js.Browser;
import js.html.ButtonElement;
import js.html.DivElement;

/**
 * ...
 * @author AS3Boyan
 */
class Alerts
{

	public function new() 
	{
		
	}
	
	public static function showAlert():Void
	{
		var div:DivElement = Browser.document.createDivElement();
		div.className = "alert alert-success alert-dismissable";
		
		var button:ButtonElement = Browser.document.createButtonElement();
		button.type = "button";
		button.className = "close";
		button.setAttribute("data-dismiss", "alert");
		button.setAttribute("aria-hidden", "true");
		button.innerHTML = "&times;";
		
		div.appendChild(button);
		div.appendChild(Browser.document.createTextNode("Test"));
		
		new JQuery("#notify_position").html(div.outerHTML);
	}
	
}