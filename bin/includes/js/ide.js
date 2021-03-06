(function () { "use strict";
function $extend(from, fields) {
	function inherit() {}; inherit.prototype = from; var proto = new inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var BuildTools = function() { }
BuildTools.__name__ = true;
BuildTools.runProject = function() {
	if(core.ProjectAccess.currentProject.type == 1) CompilerClient.buildOpenFLProject(["build",core.ProjectAccess.currentProject.target],function() {
		var nekoToolsClient = Utils.process.spawn("nekotools",["server","-p","8000"]);
		nekoToolsClient.stdout.setEncoding("utf8");
		nekoToolsClient.stdout.on("data",function(data) {
			var str = data.toString();
			console.log(str);
		});
		nekoToolsClient.stderr.setEncoding("utf8");
		nekoToolsClient.stderr.on("data",function(data) {
			var str = data.toString();
			console.log(str);
		});
		nekoToolsClient.on("close",function(code) {
			if(code == 0) {
			} else console.log("Neko Tools Server process exit code " + Std.string(code));
		});
		var $window = Utils.gui.Window.open("http://localhost:8000/Export/html5/bin/index.html",{ position : "center"});
	});
}
BuildTools.buildProject = function() {
	if(core.ProjectAccess.currentProject.type == 1) CompilerClient.buildOpenFLProject(["build",core.ProjectAccess.currentProject.target]); else CompilerClient.buildProject("haxe",core.ProjectAccess.currentProject.args);
}
var CompilerClient = function() { }
CompilerClient.__name__ = true;
CompilerClient.buildProject = function(process,params,onComplete) {
	var haxeCompilerClient = Utils.process.spawn(process,params);
	haxeCompilerClient.stdout.setEncoding("utf8");
	haxeCompilerClient.stdout.on("data",function(data) {
		var str = data.toString();
		console.log("OUTPUT: " + str);
		var textarea;
		textarea = js.Boot.__cast(window.document.getElementById("output").firstElementChild , HTMLTextAreaElement);
		textarea.value += "OUTPUT: " + str;
	});
	haxeCompilerClient.stderr.setEncoding("utf8");
	haxeCompilerClient.stderr.on("data",function(data) {
		var str = data.toString();
		console.log("ERROR: " + str);
		var textarea;
		textarea = js.Boot.__cast(window.document.getElementById("output").firstElementChild , HTMLTextAreaElement);
		textarea.value += "ERROR: " + str;
	});
	haxeCompilerClient.on("close",function(code) {
		console.log("haxeCompilerClient process exit code " + code);
		if(code == 0 && onComplete != null) onComplete();
	});
}
CompilerClient.buildOpenFLProject = function(params,onComplete) {
	CompilerClient.buildProject("haxelib",["run","openfl"].concat(params),onComplete);
}
var CompletionClient = function() { }
CompletionClient.__name__ = true;
CompletionClient.init = function() {
	new $(window.document).on("getCompletion",null,function(event,data) {
		if(core.TabsManager.editor.state.completionActive != null && core.TabsManager.editor.state.completionActive.widget != null) {
			data.data.completions = CompletionClient.completions;
			new $(window.document).triggerHandler("processHint",data);
		} else {
			console.log("get Haxe completion");
			var projectArguments = new Array();
			projectArguments = projectArguments.concat(core.ProjectAccess.currentProject.args);
			projectArguments.push("--display");
			projectArguments.push(core.TabsManager.curDoc.path + "@" + Std.string(data.doc.indexFromPos(data.from)));
			console.log(projectArguments);
			var haxeCompilerClient = Utils.process.spawn("haxe",["--connect","6001"].concat(projectArguments));
			var xml = "";
			haxeCompilerClient.stderr.setEncoding("utf8");
			haxeCompilerClient.stderr.on("data",function(data1) {
				var str = data1.toString();
				xml += str;
			});
			haxeCompilerClient.on("close",function(code) {
				if(code == 0) {
					var obj = $.xml2json(xml);
					var array;
					array = js.Boot.__cast(obj.i , Array);
					var completionItem;
					var _g = 0;
					while(_g < array.length) {
						var o = array[_g];
						++_g;
						data.data.completions.push({ name : o.n, type : "fn()"});
					}
					CompletionClient.completions = data.data.completions;
					new $(window.document).triggerHandler("processHint",data);
				} else {
					console.log("haxeCompilerClient process exit code " + Std.string(code));
					console.log(xml);
				}
			});
		}
	});
}
var CompletionServer = function() { }
CompletionServer.__name__ = true;
CompletionServer.init = function() {
	var haxeCompletionServer = js.Node.require("child_process").spawn("haxe",["--wait","6001"]);
	haxeCompletionServer.stderr.setEncoding("utf8");
	haxeCompletionServer.stderr.on("data",function(data) {
		var str = data.toString();
		var lines = str.split("\n");
		console.log("ERROR: " + lines.join(""));
	});
	haxeCompletionServer.on("close",function(code) {
		console.log("haxeCompletionServer process exit code " + code);
	});
}
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
EReg.__name__ = true;
EReg.prototype = {
	replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,__class__: EReg
}
var FileTree = function() { }
FileTree.__name__ = true;
FileTree.init = function() {
	FileTree.load("HIDE");
}
FileTree.load = function(projectName) {
	var tree;
	tree = js.Boot.__cast(window.document.getElementById("tree") , HTMLUListElement);
	new $(tree).children().remove();
	var rootTreeElement = FileTree.createDirectoryElement(projectName);
	tree.appendChild(rootTreeElement);
	FileTree.readDir("./",rootTreeElement);
}
FileTree.createDirectoryElement = function(text) {
	var directoryElement;
	var _this = window.document;
	directoryElement = _this.createElement("li");
	var a;
	var _this = window.document;
	a = _this.createElement("a");
	a.className = "tree-toggler nav-header";
	a.href = "#";
	var span;
	var _this = window.document;
	span = _this.createElement("span");
	span.className = "glyphicon glyphicon-folder-open";
	a.appendChild(span);
	var _this = window.document;
	span = _this.createElement("span");
	span.textContent = text;
	span.style.marginLeft = "5px";
	a.appendChild(span);
	a.onclick = function(e) {
		new $(directoryElement).children("ul.tree").toggle(300);
		Main.resize();
	};
	directoryElement.appendChild(a);
	var ul;
	var _this = window.document;
	ul = _this.createElement("ul");
	ul.className = "nav nav-list tree";
	directoryElement.appendChild(ul);
	return directoryElement;
}
FileTree.readDir = function(path,topElement) {
	Utils.fs.readdir(path,function(error,files) {
		var foldersCount = 0;
		var _g = 0;
		while(_g < files.length) {
			var file = [files[_g]];
			++_g;
			var filePath = [Utils.path.join(path,file[0])];
			Utils.fs.stat(filePath[0],(function(filePath,file) {
				return function(error1,stat) {
					if(stat.isFile()) {
						var li;
						var _this = window.document;
						li = _this.createElement("li");
						var a;
						var _this = window.document;
						a = _this.createElement("a");
						a.href = "#";
						a.textContent = file[0];
						a.title = filePath[0];
						a.onclick = (function(filePath) {
							return function(e) {
								core.TabsManager.openFileInNewTab(filePath[0]);
							};
						})(filePath);
						if(StringTools.endsWith(file[0],".hx")) a.style.fontWeight = "bold"; else if(StringTools.endsWith(file[0],".hxml")) {
							a.style.fontWeight = "bold";
							a.style.color = "gray";
						} else a.style.color = "gray";
						li.appendChild(a);
						var ul;
						ul = js.Boot.__cast(topElement.getElementsByTagName("ul")[0] , HTMLUListElement);
						ul.appendChild(li);
					} else if(!StringTools.startsWith(file[0],".")) {
						var ul;
						ul = js.Boot.__cast(topElement.getElementsByTagName("ul")[0] , HTMLUListElement);
						var directoryElement = FileTree.createDirectoryElement(file[0]);
						directoryElement.onclick = (function(filePath) {
							return function(e) {
								if(directoryElement.getElementsByTagName("ul")[0].childNodes.length == 0) {
									FileTree.readDir(filePath[0],directoryElement);
									e.stopPropagation();
									e.preventDefault();
									directoryElement.onclick = null;
								}
							};
						})(filePath);
						ul.appendChild(directoryElement);
						ul.insertBefore(directoryElement,ul.childNodes[foldersCount]);
						foldersCount++;
					}
				};
			})(filePath,file));
		}
		new $(topElement).children("ul.tree").show(300);
	});
}
var HxOverrides = function() { }
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
}
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
}
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
}
var Lambda = function() { }
Lambda.__name__ = true;
Lambda.indexOf = function(it,v) {
	var i = 0;
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var v2 = $it0.next();
		if(v == v2) return i;
		i++;
	}
	return -1;
}
var Layout = function() { }
Layout.__name__ = true;
Layout.init = function() {
	Layout.layout = new $("#panel").layout({ center__paneSelector : ".outer-center", west__paneSelector : ".outer-west", west__size : 200, spacing_open : 8, spacing_closed : 12, center__childOptions : { center__paneSelector : ".middle-center", south__paneSelector : ".middle-south", south__size : 100, spacing_open : 8, spacing_closed : 12}, animatePaneSizing : true, stateManagement__enabled : true});
	Layout.initPreserveLayout();
}
Layout.initPreserveLayout = function() {
	var localStorage = js.Browser.getLocalStorage();
	Utils.window.on("close",function(e) {
		var stateString = JSON.stringify(Layout.layout.readState());
		localStorage.setItem("state",stateString);
	});
	var state = localStorage.getItem("state");
	if(state != null) Layout.layout.loadState(JSON.parse(state),true);
}
var Main = function() { }
Main.__name__ = true;
Main.main = function() {
	new $(function() {
		Main.init();
	});
}
Main.close = function() {
	Sys.exit(0);
}
Main.init = function() {
	window.onresize = function(e) {
		Main.resize();
	};
	core.TabsManager.init();
	Main.initDragAndDropListeners();
	Main.initHotKeys();
	Main.initMouseZoom();
	Main.session = new Session();
	Main.settings = new haxe.ds.StringMap();
	core.FileDialog.init();
	FileTree.init();
	Layout.init();
	Main.initCorePlugin();
	PreserveWindowState.init();
	CompletionServer.init();
	CompletionClient.init();
	ui.NewProjectDialog.init();
}
Main.initMouseZoom = function() {
	window.document.onmousewheel = function(e) {
		if(e.altKey) {
			if(e.wheelDeltaY < 0) {
				var font_size = Std.parseInt(new $(".CodeMirror").css("font-size"));
				font_size--;
				Main.setFontSize(font_size);
				e.preventDefault();
				e.stopPropagation();
			} else if(e.wheelDeltaY > 0) {
				var font_size = Std.parseInt(new $(".CodeMirror").css("font-size"));
				font_size++;
				Main.setFontSize(font_size);
				e.preventDefault();
				e.stopPropagation();
			}
		}
	};
}
Main.initHotKeys = function() {
	window.addEventListener("keyup",function(e) {
		if(e.ctrlKey) {
			if(!e.shiftKey) {
				var _g = e.keyCode;
				switch(_g) {
				case 87:
					core.TabsManager.closeActiveTab();
					break;
				case 48:
					new $(".CodeMirror").css("font-size","8pt");
					new $(".CodeMirror-hint").css("font-size","8t");
					new $(".CodeMirror-hints").css("font-size",Std.string(7.2) + "pt");
					break;
				case 189:
					var font_size = Std.parseInt(new $(".CodeMirror").css("font-size"));
					font_size--;
					Main.setFontSize(font_size);
					break;
				case 187:
					var font_size = Std.parseInt(new $(".CodeMirror").css("font-size"));
					font_size++;
					Main.setFontSize(font_size);
					break;
				case 9:
					core.TabsManager.showNextTab();
					e.preventDefault();
					e.stopPropagation();
					break;
				case 79:
					core.FileAccess.openFile();
					break;
				case 83:
					core.FileAccess.saveActiveFile();
					break;
				case 78:
					core.FileAccess.createNewFile();
					break;
				default:
				}
			} else {
				var _g = e.keyCode;
				switch(_g) {
				case 48:
					Utils.window.zoomLevel = 0;
					break;
				case 189:
					Utils.zoomOut();
					break;
				case 187:
					Utils.zoomIn();
					break;
				case 9:
					core.TabsManager.showPreviousTab();
					e.preventDefault();
					e.stopPropagation();
					break;
				case 79:
					core.ProjectAccess.openProject();
					break;
				case 83:
					core.FileAccess.saveActiveFileAs();
					break;
				case 84:
					core.TabsManager.applyRandomTheme();
					break;
				case 78:
					core.ProjectAccess.createNewProject();
					break;
				case 82:
					Utils.window.reloadIgnoringCache();
					break;
				default:
				}
			}
		} else if(e.keyCode == 13 && e.shiftKey && e.altKey) Utils.toggleFullscreen(); else if(e.keyCode == 116) {
			if(core.ProjectAccess.currentProject != null) BuildTools.runProject();
		} else if(e.keyCode == 119) {
			if(core.ProjectAccess.currentProject != null) BuildTools.buildProject();
		}
	});
}
Main.initDragAndDropListeners = function() {
	window.ondragover = function(e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	};
	window.ondrop = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var _g1 = 0;
		var _g = e.dataTransfer.files.length;
		while(_g1 < _g) {
			var i = _g1++;
			core.TabsManager.openFileInNewTab(e.dataTransfer.files[i].path);
		}
		return false;
	};
}
Main.resize = function() {
	if(core.TabsManager.editor != null) core.TabsManager.editor.refresh();
}
Main.setFontSize = function(font_size) {
	new $(".CodeMirror").css("font-size",Std.string(font_size) + "px");
	new $(".CodeMirror-hint").css("font-size",Std.string(font_size - 2) + "px");
	new $(".CodeMirror-hints").css("font-size",Std.string(font_size - 2) + "px");
}
Main.initCorePlugin = function() {
	Main.initMenu();
}
Main.initMenu = function() {
	Main.menus = new haxe.ds.StringMap();
	Main.menus.set("file",new ui.menu.FileMenu());
	Main.menus.set("edit",new ui.menu.EditMenu());
	Main.menus.set("view",new ui.menu.ViewMenu());
	Main.menus.set("source",new ui.menu.SourceMenu());
	Main.menus.set("run",new ui.menu.RunMenu());
	Main.menus.set("help",new ui.menu.HelpMenu());
	Main.menus.set("developertools",new ui.menu.DeveloperToolsMenu());
	haxe.Timer.delay(Main.updateMenu,100);
	haxe.Timer.delay(Main.updateMenu,10000);
}
Main.updateMenu = function() {
	var fileMenuDisabledItems = new Array();
	if(core.TabsManager.docs.length == 0) {
		fileMenuDisabledItems.push("Close File");
		fileMenuDisabledItems.push("Save");
		fileMenuDisabledItems.push("Save as...");
		fileMenuDisabledItems.push("Save all");
		Main.menus.get("edit").setMenuEnabled(false);
	} else Main.menus.get("edit").setMenuEnabled(true);
	if(core.ProjectAccess.currentProject == null) {
		fileMenuDisabledItems.push("Close Project...");
		fileMenuDisabledItems.push("Project Properties");
		Main.menus.get("run").setMenuEnabled(false);
	} else Main.menus.get("run").setMenuEnabled(true);
	Main.menus.get("file").setDisabled(fileMenuDisabledItems);
}
var IMap = function() { }
IMap.__name__ = true;
Math.__name__ = true;
var OpenFLTools = function() { }
OpenFLTools.__name__ = true;
OpenFLTools.getParams = function(path,target,onLoaded) {
	js.Node.process.chdir(path);
	var openFLTools = Utils.process.spawn("haxelib",["run","openfl","display",target]);
	var params = new Array();
	openFLTools.stdout.setEncoding("utf8");
	openFLTools.stdout.on("data",function(data) {
		var str = data.toString();
		var textarea;
		textarea = js.Boot.__cast(window.document.getElementById("output").firstElementChild , HTMLTextAreaElement);
		textarea.value += "OUTPUT: " + str;
		params = params.concat(str.split("\n"));
	});
	openFLTools.stderr.setEncoding("utf8");
	openFLTools.stderr.on("data",function(data) {
		var str = data.toString();
		console.log("ERROR: " + str);
		var textarea;
		textarea = js.Boot.__cast(window.document.getElementById("output").firstElementChild , HTMLTextAreaElement);
		textarea.value += "ERROR: " + str;
	});
	openFLTools.on("close",function(code) {
		console.log("OpenFL tools process exit code " + code);
		if(code == 0) {
			if(onLoaded != null) onLoaded(params);
		}
	});
}
var PreserveWindowState = function() { }
PreserveWindowState.__name__ = true;
PreserveWindowState.init = function() {
	PreserveWindowState.initWindowState();
	Utils.window.on("maximize",function() {
		PreserveWindowState.isMaximizationEvent = true;
		PreserveWindowState.currWinMode = "maximized";
	});
	Utils.window.on("unmaximize",function() {
		PreserveWindowState.currWinMode = "normal";
		PreserveWindowState.restoreWindowState();
	});
	Utils.window.on("minimize",function() {
		PreserveWindowState.currWinMode = "minimized";
	});
	Utils.window.on("restore",function() {
		PreserveWindowState.currWinMode = "normal";
	});
	Utils.window.window.addEventListener("resize",function(e) {
		if(PreserveWindowState.resizeTimeout != null) PreserveWindowState.resizeTimeout.stop();
		PreserveWindowState.resizeTimeout = new haxe.Timer(500);
		PreserveWindowState.resizeTimeout.run = function() {
			if(PreserveWindowState.isMaximizationEvent) PreserveWindowState.isMaximizationEvent = false; else if(PreserveWindowState.currWinMode == "maximized") PreserveWindowState.currWinMode = "normal";
			PreserveWindowState.resizeTimeout.stop();
			PreserveWindowState.dumpWindowState();
		};
	},false);
	Utils.window.on("close",function(e) {
		PreserveWindowState.saveWindowState();
		Utils.window.close(true);
	});
}
PreserveWindowState.initWindowState = function() {
	var windowState = js.Browser.getLocalStorage().getItem("windowState");
	if(windowState != null) PreserveWindowState.winState = JSON.parse(windowState);
	if(PreserveWindowState.winState != null) {
		PreserveWindowState.currWinMode = PreserveWindowState.winState.mode;
		if(PreserveWindowState.currWinMode == "maximized") Utils.window.maximize(); else PreserveWindowState.restoreWindowState();
	} else {
		PreserveWindowState.currWinMode = "normal";
		PreserveWindowState.dumpWindowState();
	}
	Utils.window.show();
}
PreserveWindowState.dumpWindowState = function() {
	if(PreserveWindowState.winState == null) PreserveWindowState.winState = { };
	if(PreserveWindowState.currWinMode == "maximized") PreserveWindowState.winState.mode = "maximized"; else PreserveWindowState.winState.mode = "normal";
	if(PreserveWindowState.currWinMode == "normal") {
		PreserveWindowState.winState.x = Utils.window.x;
		PreserveWindowState.winState.y = Utils.window.y;
		PreserveWindowState.winState.width = Utils.window.width;
		PreserveWindowState.winState.height = Utils.window.height;
	}
}
PreserveWindowState.restoreWindowState = function() {
	Utils.window.resizeTo(PreserveWindowState.winState.width,PreserveWindowState.winState.height);
	Utils.window.moveTo(PreserveWindowState.winState.x,PreserveWindowState.winState.y);
}
PreserveWindowState.saveWindowState = function() {
	PreserveWindowState.dumpWindowState();
	js.Browser.getLocalStorage().setItem("windowState",JSON.stringify(PreserveWindowState.winState));
}
var Project = function() {
	this.customArgs = false;
};
Project.__name__ = true;
Project.prototype = {
	__class__: Project
}
var Session = function() {
};
Session.__name__ = true;
Session.prototype = {
	__class__: Session
}
var Std = function() { }
Std.__name__ = true;
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
}
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
}
Std.random = function(x) {
	if(x <= 0) return 0; else return Math.floor(Math.random() * x);
}
var StringTools = function() { }
StringTools.__name__ = true;
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && HxOverrides.substr(s,0,start.length) == start;
}
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	return slen >= elen && HxOverrides.substr(s,slen - elen,elen) == end;
}
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
}
var Sys = function() { }
Sys.__name__ = true;
Sys.exit = function(code) {
	js.Node.process.exit(code);
}
var js = {}
js.Node = function() { }
js.Node.__name__ = true;
var Utils = function() { }
Utils.__name__ = true;
Utils.getOS = function() {
	var os_type = null;
	var _g = Utils.os.type();
	switch(_g) {
	case "Windows_NT":
		os_type = 0;
		break;
	case "Linux":
		os_type = 1;
		break;
	default:
		os_type = 2;
	}
	return os_type;
}
Utils.toggleFullscreen = function() {
	Utils.window.toggleFullscreen();
}
Utils.zoomIn = function() {
	Utils.window.zoomLevel = Utils.window.zoomLevel + 1;
}
Utils.zoomOut = function() {
	Utils.window.zoomLevel = Utils.window.zoomLevel - 1;
}
Utils.capitalize = function(myString) {
	return HxOverrides.substr(myString,0,1).toUpperCase() + HxOverrides.substr(myString,1,null);
}
Utils.system_openFile = function(filename,onLoaded) {
	Utils.fs.readFile(filename,"utf-8",function(error,data) {
		if(error != null) console.log(error);
		onLoaded(data);
	});
}
Utils.system_saveFile = function(filename,content) {
	Utils.fs.writeFile(filename,content,null,function(error) {
		if(error != null) console.log(error);
		console.log("SYSTEM: file saved " + filename);
	});
}
var core = {}
core.FileAccess = function() { }
core.FileAccess.__name__ = true;
core.FileAccess.createNewFile = function() {
	core.TabsManager.createFileInNewTab();
}
core.FileAccess.openFile = function() {
	core.FileDialog.openFile(core.TabsManager.openFileInNewTab);
}
core.FileAccess.saveActiveFile = function() {
	console.log("save active file");
	var curDoc = core.TabsManager.curDoc;
	var curDoc_filepath = curDoc.path;
	var curDoc_val = curDoc.doc.cm.getValue();
	var historySize = curDoc.doc.historySize();
	if(curDoc_filepath != "" && historySize.undo == 0 && historySize.redo == 0) {
		console.log("no changes detected");
		return;
	}
	if(curDoc_filepath == "") core.FileDialog.saveFile(function(path) {
		Utils.system_saveFile(path,curDoc_val);
	},curDoc.name); else Utils.system_saveFile(curDoc_filepath,curDoc_val);
}
core.FileAccess.closeActiveFile = function() {
	core.TabsManager.closeActiveTab();
}
core.FileAccess.saveActiveFileAs = function() {
	var curDoc = core.TabsManager.curDoc;
	var curDoc_val = curDoc.doc.cm.getValue();
	core.FileDialog.saveFile(function(path) {
		Utils.system_saveFile(path,curDoc_val);
		curDoc.path = path;
	},curDoc.name);
}
core.FileAccess.saveAll = function() {
	var _g = 0;
	var _g1 = core.TabsManager.docs;
	while(_g < _g1.length) {
		var doc = _g1[_g];
		++_g;
		if(doc != null) Utils.system_saveFile(doc.path,doc.doc.getValue());
	}
}
core.FileDialog = function() { }
core.FileDialog.__name__ = true;
core.FileDialog.init = function() {
	var _this = window.document;
	core.FileDialog.input = _this.createElement("input");
	core.FileDialog.input.type = "file";
	core.FileDialog.input.style.display = "none";
	core.FileDialog.input.addEventListener("change",function(e) {
		var value = core.FileDialog.input.value;
		if(value != "") core.FileDialog.onClick(value);
	});
	window.document.body.appendChild(core.FileDialog.input);
}
core.FileDialog.openFile = function(_onClick) {
	core.FileDialog.input.value = "";
	core.FileDialog.onClick = _onClick;
	if(core.FileDialog.input.hasAttribute("nwsaveas")) core.FileDialog.input.removeAttribute("nwsaveas");
	if(core.FileDialog.input.hasAttribute("nwdirectory")) core.FileDialog.input.removeAttribute("nwdirectory");
	core.FileDialog.input.click();
}
core.FileDialog.saveFile = function(_onClick,_name) {
	core.FileDialog.input.value = "";
	core.FileDialog.onClick = _onClick;
	if(_name == null) _name = "";
	if(core.FileDialog.input.hasAttribute("nwdirectory")) core.FileDialog.input.removeAttribute("nwdirectory");
	core.FileDialog.input.setAttribute("nwsaveas",_name);
	core.FileDialog.input.click();
}
core.FileDialog.openFolder = function(_onClick) {
	core.FileDialog.input.value = "";
	core.FileDialog.onClick = _onClick;
	if(core.FileDialog.input.hasAttribute("nwsaveas")) core.FileDialog.input.removeAttribute("nwsaveas");
	core.FileDialog.input.setAttribute("nwdirectory","");
	core.FileDialog.input.click();
}
core.ProjectAccess = function() { }
core.ProjectAccess.__name__ = true;
core.ProjectAccess.createNewProject = function() {
	ui.NewProjectDialog.show();
}
core.ProjectAccess.openProject = function() {
	core.FileDialog.openFile(function(path) {
		Utils.system_openFile(path,function(content) {
			var project;
			var _g = Utils.path.extname(path);
			switch(_g) {
			case ".xml":
				project = new Project();
				project.type = 1;
				project.target = "html5";
				project.main = path;
				OpenFLTools.getParams(Utils.path.dirname(path),project.target,function(params) {
					project.args = params;
					core.ProjectAccess.saveProject(path,project);
				});
				FileTree.load("OpenFLProject");
				break;
			case ".hxml":
				project = new Project();
				project.type = 2;
				project.main = path;
				project.args = content.split("\n");
				core.ProjectAccess.saveProject(path,project);
				break;
			default:
				project = JSON.parse(content);
			}
			core.ProjectAccess.currentProject = project;
			Main.updateMenu();
		});
	});
}
core.ProjectAccess.saveProject = function(path,project) {
	var pathToProjectFile = Utils.path.join(Utils.path.dirname(path),"project.hide");
	Utils.fs.exists(pathToProjectFile,function(exists) {
		if(!exists) Utils.system_saveFile(pathToProjectFile,JSON.stringify(project));
	});
}
core.ProjectAccess.configureProject = function() {
	console.log("configure project");
}
core.ProjectAccess.closeProject = function() {
	core.ProjectAccess.currentProject = null;
}
core.TabsManager = function() { }
core.TabsManager.__name__ = true;
core.TabsManager.init = function() {
	core.TabsManager.themes = ["3024-day","3024-night","ambiance","base16-dark","base16-light","blackboard","cobalt","eclipse","elegant","erlang-dark","lesser-dark","midnight","monokai","neat","night","paraiso-dark","paraiso-light","rubyblue","solarized dark","solarized light","the-matrix","tomorrow-night-eighties","twilight","vibrant-ink","xq-dark","xq-light"];
	CodeMirror.on(window,"load",function() {
		core.TabsManager.initEditor();
		Main.resize();
		core.TabsManager.editor.refresh();
		core.TabsManager.createContextMenu();
	});
}
core.TabsManager.createContextMenu = function() {
	var contextMenu;
	var _this = window.document;
	contextMenu = _this.createElement("div");
	contextMenu.className = "dropdown";
	contextMenu.style.position = "absolute";
	contextMenu.style.display = "none";
	window.document.onclick = function(e) {
		contextMenu.style.display = "none";
	};
	var ul;
	var _this = window.document;
	ul = _this.createElement("ul");
	ul.className = "dropdown-menu";
	ul.style.display = "block";
	ul.appendChild(core.TabsManager.createContextMenuItem("New File...",core.TabsManager.createFileInNewTab));
	var li;
	var _this = window.document;
	li = _this.createElement("li");
	li.className = "divider";
	ul.appendChild(li);
	ul.appendChild(core.TabsManager.createContextMenuItem("Close",function() {
		core.TabsManager.closeTab(contextMenu.getAttribute("path"));
	}));
	ul.appendChild(core.TabsManager.createContextMenuItem("Close All",function() {
		core.TabsManager.closeAll();
	}));
	ul.appendChild(core.TabsManager.createContextMenuItem("Close Other",function() {
		var path = contextMenu.getAttribute("path");
		core.TabsManager.closeOthers(path);
	}));
	contextMenu.appendChild(ul);
	window.document.body.appendChild(contextMenu);
	window.document.getElementById("docs").addEventListener("contextmenu",function(ev) {
		ev.preventDefault();
		var clickedOnTab = false;
		var _g = 0;
		var _g1 = window.document.getElementById("docs").childNodes;
		while(_g < _g1.length) {
			var li1 = _g1[_g];
			++_g;
			if(ev.target == li1) {
				clickedOnTab = true;
				break;
			}
		}
		if(clickedOnTab) {
			var li1;
			li1 = js.Boot.__cast(ev.target , HTMLLIElement);
			contextMenu.setAttribute("path",li1.getAttribute("path"));
			contextMenu.style.display = "block";
			contextMenu.style.left = Std.string(ev.pageX) + "px";
			contextMenu.style.top = Std.string(ev.pageY) + "px";
		}
		return false;
	});
}
core.TabsManager.createContextMenuItem = function(text,onClick) {
	var li;
	var _this = window.document;
	li = _this.createElement("li");
	li.onclick = function(e) {
		onClick();
	};
	var a;
	var _this = window.document;
	a = _this.createElement("a");
	a.href = "#";
	a.textContent = text;
	li.appendChild(a);
	return li;
}
core.TabsManager.applyRandomTheme = function() {
	var theme = core.TabsManager.themes[Std.random(core.TabsManager.themes.length)];
	core.TabsManager.editor.setOption("theme",theme);
	new $("body").css("background",new $(".CodeMirror").css("background"));
	new $("#style_override").append("<style>ul.tabs li {background: " + new $(".CodeMirror").css("background") + ";}</style>");
	new $("#style_override").append("<style>ul.tabs li {color: " + new $(".CodeMirror").css("color") + ";}</style>");
	new $("#style_override").append("<style>ul.tabs li:hover {color: " + new $(".cm-keyword").css("color") + ";}</style>");
	new $("#style_override").append("<style>ul.tabs li.selected {background: " + new $(".CodeMirror").css("background") + ";}</style>");
	new $("#style_override").append("<style>ul.tabs li.selected {color: " + new $(".cm-variable").css("color") + ";}</style>");
	new $("#style_override").append("<style>.CodeMirror-hints {background: " + new $(".CodeMirror").css("background") + ";}</style>");
	new $("#style_override").append("<style>.CodeMirror-hint {color: " + new $(".cm-variable").css("color") + ";}</style>");
	new $("#style_override").append("<style>.CodeMirror-hint-active {background: " + new $(".CodeMirror").css("background") + ";}</style>");
	new $("#style_override").append("<style>.CodeMirror-hint-active {color: " + new $(".cm-keyword").css("color") + ";}</style>");
}
core.TabsManager.createFileInNewTab = function() {
	core.FileDialog.saveFile(function(value) {
		var path = core.TabsManager.convertPathToUnixFormat(value);
		if(core.TabsManager.isAlreadyOpened(path)) return;
		var name = core.TabsManager.getFileName(path);
		var mode = core.TabsManager.getMode(name);
		var code = "";
		if(Utils.path.extname(name) == ".hx") {
			path = HxOverrides.substr(path,0,path.length - name.length) + Utils.capitalize(name);
			code = "package ;\n\nclass " + Utils.path.basename(name) + "\n{\n\n}";
		}
		core.TabsManager.registerDoc(name,new CodeMirror.Doc(code,mode),path);
		core.TabsManager.selectDoc(core.TabsManager.docs.length - 1);
	});
}
core.TabsManager.convertPathToUnixFormat = function(path) {
	if(Utils.getOS() == 0) {
		var ereg = new EReg("[\\\\]","g");
		path = ereg.replace(path,"/");
	}
	return path;
}
core.TabsManager.isAlreadyOpened = function(path) {
	var opened = false;
	var _g1 = 0;
	var _g = core.TabsManager.docs.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(core.TabsManager.docs[i].path == path) {
			core.TabsManager.selectDoc(i);
			opened = true;
			break;
		}
	}
	return opened;
}
core.TabsManager.getFileName = function(path) {
	var pos = null;
	if(Utils.getOS() == 0) {
		pos = path.lastIndexOf("\\");
		if(pos == -1) pos = path.lastIndexOf("/");
	} else pos = path.lastIndexOf("/");
	var filename = null;
	if(pos != -1) filename = HxOverrides.substr(path,pos + 1,null); else filename = path;
	return filename;
}
core.TabsManager.getMode = function(filename) {
	var mode = "haxe";
	var _g = Utils.path.extname(filename);
	switch(_g) {
	case ".js":
		mode = "javascript";
		break;
	case ".css":
		mode = "css";
		break;
	case ".xml":
		mode = "xml";
		break;
	case ".html":
		mode = "text/html";
		break;
	case ".md":
		mode = "markdown";
		break;
	case ".sh":case ".bat":
		mode = "shell";
		break;
	case ".ml":
		mode = "ocaml";
		break;
	default:
	}
	return mode;
}
core.TabsManager.openFileInNewTab = function(path) {
	path = core.TabsManager.convertPathToUnixFormat(path);
	if(core.TabsManager.isAlreadyOpened(path)) return;
	var filename = core.TabsManager.getFileName(path);
	Utils.system_openFile(path,function(data) {
		var mode = core.TabsManager.getMode(filename);
		core.TabsManager.registerDoc(filename,new CodeMirror.Doc(data,mode),path);
		core.TabsManager.selectDoc(core.TabsManager.docs.length - 1);
		if(new $("#sourceCodeEditor").css("display") == "none" && core.TabsManager.docs.length > 0) {
			new $("#sourceCodeEditor").css("display","block");
			core.TabsManager.editor.refresh();
			Main.updateMenu();
		}
		Main.resize();
	});
}
core.TabsManager.closeAll = function() {
	var _g1 = 0;
	var _g = core.TabsManager.docs.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(core.TabsManager.docs[i] != null) core.TabsManager.closeTab(core.TabsManager.docs[i].path,false);
	}
	if(core.TabsManager.docs.length > 0) haxe.Timer.delay(function() {
		core.TabsManager.closeAll();
	},30);
}
core.TabsManager.closeOthers = function(path) {
	var _g1 = 0;
	var _g = core.TabsManager.docs.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(core.TabsManager.docs[i] != null && path != core.TabsManager.docs[i].path) core.TabsManager.closeTab(core.TabsManager.docs[i].path);
	}
	if(core.TabsManager.docs.length > 1) haxe.Timer.delay(function() {
		core.TabsManager.closeOthers(path);
	},30);
}
core.TabsManager.closeTab = function(path,switchToTab) {
	if(switchToTab == null) switchToTab = true;
	var _g1 = 0;
	var _g = core.TabsManager.docs.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(core.TabsManager.docs[i] != null && core.TabsManager.docs[i].path == path) core.TabsManager.unregisterDoc(core.TabsManager.docs[i],switchToTab);
	}
}
core.TabsManager.closeActiveTab = function() {
	core.TabsManager.unregisterDoc(core.TabsManager.curDoc);
}
core.TabsManager.showNextTab = function() {
	var n = Lambda.indexOf(core.TabsManager.docs,core.TabsManager.curDoc);
	n++;
	if(n > core.TabsManager.docs.length - 1) n = 0;
	core.TabsManager.selectDoc(n);
}
core.TabsManager.showPreviousTab = function() {
	var n = Lambda.indexOf(core.TabsManager.docs,core.TabsManager.curDoc);
	n--;
	if(n < 0) n = core.TabsManager.docs.length - 1;
	core.TabsManager.selectDoc(n);
}
core.TabsManager.initEditor = function() {
	var keyMap = { 'Ctrl-I' : function(cm) {
		core.TabsManager.server.showType(cm);
	}, 'Ctrl-Space' : function(cm) {
		core.TabsManager.server.complete(cm);
	}, 'Alt-.' : function(cm) {
		core.TabsManager.server.jumpToDef(cm);
	}, 'Alt-,' : function(cm) {
		core.TabsManager.server.jumpBack(cm);
	}, 'Ctrl-Q' : function(cm) {
		core.TabsManager.server.rename(cm);
	}};
	core.TabsManager.editor = CodeMirror.fromTextArea(window.document.getElementById("code"),{ lineNumbers : true, extraKeys : keyMap, matchBrackets : true, dragDrop : false, autoCloseBrackets : true, foldGutter : { rangeFinder : new CodeMirror.fold.combine(CodeMirror.fold.brace, CodeMirror.fold.comment)}, gutters : ["CodeMirror-linenumbers","CodeMirror-foldgutter"]});
	core.TabsManager.server = new CodeMirror.TernServer({ defs : [], plugins : { doc_comment : true}, switchToDoc : function(name) {
		core.TabsManager.selectDoc(core.TabsManager.docID(name));
	}, workerDeps : ["./includes/js/acorn/acorn.js","./includes/js/acorn/acorn_loose.js","./includes/js/acorn/util/walk.js","./includes/js/tern/lib/signal.js","./includes/js/tern/lib/tern.js","./includes/js/tern/lib/def.js","./includes/js/tern/lib/infer.js","./includes/js/tern/lib/comment.js","./includes/js/tern/plugin/doc_comment.js"], workerScript : "./includes/js/codemirror-3.18/addon/tern/worker.js", useWorker : core.TabsManager.useWorker});
	core.TabsManager.editor.on("cursorActivity",function(cm) {
		core.TabsManager.server.updateArgHints(cm);
	});
	core.TabsManager.openFileInNewTab("../src/Main.hx");
	CodeMirror.on(window.document.getElementById("docs"),"click",function(e) {
		var target = e.target || e.srcElement;
		if(target.nodeName.toLowerCase() != "li") return;
		var i = 0;
		var c = target.parentNode.firstChild;
		if(c == target) return core.TabsManager.selectDoc(0); else while(true) {
			i++;
			c = c.nextSibling;
			if(c == target) return core.TabsManager.selectDoc(i);
		}
	});
}
core.TabsManager.docID = function(name) {
	var _g1 = 0;
	var _g = core.TabsManager.docs.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(core.TabsManager.docs[i].name == name) return i;
	}
	return null;
}
core.TabsManager.registerDoc = function(name,doc,path) {
	core.TabsManager.server.addDoc(name,doc,path);
	var data = { name : name, doc : doc, path : path};
	core.TabsManager.docs.push(data);
	var docTabs = window.document.getElementById("docs");
	var li;
	var _this = window.document;
	li = _this.createElement("li");
	li.title = path;
	li.innerText = name + "\t";
	li.setAttribute("path",path);
	var span;
	var _this = window.document;
	span = _this.createElement("span");
	span.style.position = "relative";
	span.style.top = "2px";
	span.onclick = function(e) {
		core.TabsManager.closeTab(path);
	};
	var span2;
	var _this = window.document;
	span2 = _this.createElement("span");
	span2.className = "glyphicon glyphicon-remove-circle";
	span.appendChild(span2);
	li.appendChild(span);
	docTabs.appendChild(li);
	if(core.TabsManager.editor.getDoc() == doc) {
		core.TabsManager.setSelectedDoc(core.TabsManager.docs.length - 1);
		core.TabsManager.curDoc = data;
	}
}
core.TabsManager.unregisterDoc = function(doc,switchToTab) {
	if(switchToTab == null) switchToTab = true;
	var b = core.TabsManager.curDoc == doc;
	core.TabsManager.server.delDoc(doc.name);
	var j = null;
	var _g1 = 0;
	var _g = core.TabsManager.docs.length;
	while(_g1 < _g) {
		var i = _g1++;
		j = i;
		if(doc == core.TabsManager.docs[i]) break;
	}
	core.TabsManager.docs.splice(j,1);
	var docList = window.document.getElementById("docs");
	docList.removeChild(docList.childNodes[j]);
	if(switchToTab && b && docList.childNodes.length > 0) core.TabsManager.selectDoc((function($this) {
		var $r;
		var x = Math.max(0,j - 1);
		$r = x | 0;
		return $r;
	}(this)));
	if(docList.childNodes.length == 0) {
		new $("#sourceCodeEditor").css("display","none");
		Main.updateMenu();
	}
	Main.resize();
}
core.TabsManager.setSelectedDoc = function(pos) {
	var docTabs = window.document.getElementById("docs");
	var _g1 = 0;
	var _g = docTabs.childNodes.length;
	while(_g1 < _g) {
		var i = _g1++;
		var child;
		child = js.Boot.__cast(docTabs.childNodes[i] , Element);
		if(pos == i) child.className = "selected"; else child.className = "";
	}
}
core.TabsManager.selectDoc = function(pos) {
	if(core.TabsManager.curDoc != null) core.TabsManager.server.hideDoc(core.TabsManager.curDoc.name);
	core.TabsManager.setSelectedDoc(pos);
	core.TabsManager.curDoc = core.TabsManager.docs[pos];
	core.TabsManager.editor.swapDoc(core.TabsManager.curDoc.doc);
}
var haxe = {}
haxe.Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe.Timer.__name__ = true;
haxe.Timer.delay = function(f,time_ms) {
	var t = new haxe.Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
}
haxe.Timer.prototype = {
	stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
	,__class__: haxe.Timer
}
haxe.ds = {}
haxe.ds.StringMap = function() {
	this.h = { };
};
haxe.ds.StringMap.__name__ = true;
haxe.ds.StringMap.__interfaces__ = [IMap];
haxe.ds.StringMap.prototype = {
	set: function(key,value) {
		this.h["$" + key] = value;
	}
	,get: function(key) {
		return this.h["$" + key];
	}
	,__class__: haxe.ds.StringMap
}
js.Boot = function() { }
js.Boot.__name__ = true;
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i;
			var str = "[";
			s += "\t";
			var _g = 0;
			while(_g < l) {
				var i1 = _g++;
				str += (i1 > 0?",":"") + js.Boot.__string_rec(o[i1],s);
			}
			str += "]";
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) { ;
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
}
js.Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js.Boot.__interfLoop(cc.__super__,cl);
}
js.Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) {
					if(cl == Array) return o.__enum__ == null;
					return true;
				}
				if(js.Boot.__interfLoop(o.__class__,cl)) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
}
js.Boot.__cast = function(o,t) {
	if(js.Boot.__instanceof(o,t)) return o; else throw "Cannot cast " + Std.string(o) + " to " + Std.string(t);
}
js.Browser = function() { }
js.Browser.__name__ = true;
js.Browser.getLocalStorage = function() {
	try {
		var s = window.localStorage;
		s.getItem("");
		return s;
	} catch( e ) {
		return null;
	}
}
var ui = {}
ui.NewProjectDialog = function() { }
ui.NewProjectDialog.__name__ = true;
ui.NewProjectDialog.init = function() {
	var _this = window.document;
	ui.NewProjectDialog.modal = _this.createElement("div");
	ui.NewProjectDialog.modal.className = "modal fade";
	var dialog;
	var _this = window.document;
	dialog = _this.createElement("div");
	dialog.className = "modal-dialog";
	ui.NewProjectDialog.modal.appendChild(dialog);
	var content;
	var _this = window.document;
	content = _this.createElement("div");
	content.className = "modal-content";
	dialog.appendChild(content);
	var header;
	var _this = window.document;
	header = _this.createElement("div");
	header.className = "modal-header";
	content.appendChild(header);
	var button;
	var _this = window.document;
	button = _this.createElement("button");
	button.type = "button";
	button.className = "close";
	button.setAttribute("data-dismiss","modal");
	button.setAttribute("aria-hidden","true");
	button.innerHTML = "&times;";
	header.appendChild(button);
	var h4;
	h4 = js.Boot.__cast(window.document.createElement("h4") , HTMLHeadingElement);
	h4.className = "modal-title";
	h4.textContent = "New Project";
	header.appendChild(h4);
	var body;
	var _this = window.document;
	body = _this.createElement("div");
	body.className = "modal-body";
	body.style.overflow = "hidden";
	content.appendChild(body);
	ui.NewProjectDialog.textfieldsWithCheckboxes = new haxe.ds.StringMap();
	ui.NewProjectDialog.checkboxes = new haxe.ds.StringMap();
	ui.NewProjectDialog.createPage1();
	body.appendChild(ui.NewProjectDialog.page1);
	ui.NewProjectDialog.createPage2();
	ui.NewProjectDialog.page2.style.display = "none";
	body.appendChild(ui.NewProjectDialog.page2);
	var footer;
	var _this = window.document;
	footer = _this.createElement("div");
	footer.className = "modal-footer";
	content.appendChild(footer);
	var _this = window.document;
	ui.NewProjectDialog.backButton = _this.createElement("button");
	ui.NewProjectDialog.backButton.type = "button";
	ui.NewProjectDialog.backButton.className = "btn btn-default disabled";
	ui.NewProjectDialog.backButton.textContent = "Back";
	footer.appendChild(ui.NewProjectDialog.backButton);
	var _this = window.document;
	ui.NewProjectDialog.nextButton = _this.createElement("button");
	ui.NewProjectDialog.nextButton.type = "button";
	ui.NewProjectDialog.nextButton.className = "btn btn-default";
	ui.NewProjectDialog.nextButton.textContent = "Next";
	ui.NewProjectDialog.backButton.onclick = function(e) {
		if(ui.NewProjectDialog.backButton.className.indexOf("disabled") == -1) ui.NewProjectDialog.showPage1();
	};
	ui.NewProjectDialog.nextButton.onclick = function(e) {
		if(ui.NewProjectDialog.nextButton.className.indexOf("disabled") == -1) ui.NewProjectDialog.showPage2();
	};
	footer.appendChild(ui.NewProjectDialog.nextButton);
	var finishButton;
	var _this = window.document;
	finishButton = _this.createElement("button");
	finishButton.type = "button";
	finishButton.className = "btn btn-default";
	finishButton.textContent = "Finish";
	finishButton.onclick = function(e) {
		if(ui.NewProjectDialog.page1.style.display != "none" || ui.NewProjectDialog.projectName.value == "") ui.NewProjectDialog.generateProjectName(ui.NewProjectDialog.createProject); else ui.NewProjectDialog.createProject();
	};
	footer.appendChild(finishButton);
	var cancelButton;
	var _this = window.document;
	cancelButton = _this.createElement("button");
	cancelButton.type = "button";
	cancelButton.className = "btn btn-default";
	cancelButton.setAttribute("data-dismiss","modal");
	cancelButton.textContent = "Cancel";
	footer.appendChild(cancelButton);
	window.document.body.appendChild(ui.NewProjectDialog.modal);
	ui.NewProjectDialog.updateListItems("Haxe");
	window.addEventListener("keyup",function(e) {
		if(e.keyCode == 27) new $(ui.NewProjectDialog.modal).modal("hide");
	});
	var location = js.Browser.getLocalStorage().getItem("Location");
	if(location != null) ui.NewProjectDialog.projectLocation.value = location;
	ui.NewProjectDialog.loadData("Package");
	ui.NewProjectDialog.loadData("Company");
	ui.NewProjectDialog.loadData("License");
	ui.NewProjectDialog.loadData("URL");
	ui.NewProjectDialog.loadCheckboxState("Package");
	ui.NewProjectDialog.loadCheckboxState("Company");
	ui.NewProjectDialog.loadCheckboxState("License");
	ui.NewProjectDialog.loadCheckboxState("URL");
	ui.NewProjectDialog.loadCheckboxState("CreateDirectory");
}
ui.NewProjectDialog.showPage1 = function() {
	new $(ui.NewProjectDialog.page1).show(300);
	new $(ui.NewProjectDialog.page2).hide(300);
	ui.NewProjectDialog.backButton.className = "btn btn-default disabled";
	ui.NewProjectDialog.nextButton.className = "btn btn-default";
}
ui.NewProjectDialog.showPage2 = function() {
	ui.NewProjectDialog.generateProjectName();
	new $(ui.NewProjectDialog.page1).hide(300);
	new $(ui.NewProjectDialog.page2).show(300);
	ui.NewProjectDialog.backButton.className = "btn btn-default";
	ui.NewProjectDialog.nextButton.className = "btn btn-default disabled";
}
ui.NewProjectDialog.createProject = function() {
	if(ui.NewProjectDialog.projectLocation.value != "" && ui.NewProjectDialog.projectName.value != "") Utils.fs.exists(ui.NewProjectDialog.projectLocation.value,function(exists) {
		if(exists) {
			js.Node.process.chdir(Utils.path.join(ui.NewProjectDialog.projectLocation.value));
			var project = new Project();
			var _g = ui.NewProjectDialog.selectedCategory;
			switch(_g) {
			case "Haxe":
				ui.NewProjectDialog.createDirectoryRecursively(ui.NewProjectDialog.projectLocation.value,[ui.NewProjectDialog.projectName.value,"src"],function() {
					var pathToMain = Utils.path.join(ui.NewProjectDialog.projectLocation.value,ui.NewProjectDialog.projectName.value,"src");
					pathToMain = Utils.path.join(pathToMain,"Main.hx");
					var code = "package ;\n\nclass Main\n{\nstatic public function main()\n{\n}\n}";
					Utils.fs.writeFile(pathToMain,code,null,function(error) {
						if(error != null) console.log(error);
						core.TabsManager.openFileInNewTab(pathToMain);
					});
				});
				project.type = 0;
				var _g1 = ui.NewProjectDialog.list.value;
				switch(_g1) {
				case "Flash Project":
					project.target = "flash";
					break;
				case "JavaScript Project":
					project.target = "html5";
					break;
				case "Neko Project":
					project.target = "neko";
					break;
				case "PHP Project":
					project.target = "php";
					break;
				case "C++ Project":
					project.target = "cpp";
					break;
				case "Java Project":
					project.target = "java";
					break;
				case "C# Project":
					project.target = "csharp";
					break;
				default:
				}
				var pathToMain = Utils.path.join(ui.NewProjectDialog.projectName.value,"src");
				pathToMain = Utils.path.join(pathToMain,"Main.hx");
				project.main = pathToMain;
				break;
			case "OpenFL":
				var _g1 = ui.NewProjectDialog.list.value;
				switch(_g1) {
				case "OpenFL Project":
					var projectPackage = ui.NewProjectDialog.textfieldsWithCheckboxes.get("Package").value;
					var str = "";
					if(ui.NewProjectDialog.checkboxes.get("Package").checked && projectPackage != "") str = projectPackage + ".";
					var params = ["project",str + ui.NewProjectDialog.projectName.value];
					var projectCompany = ui.NewProjectDialog.textfieldsWithCheckboxes.get("Company").value;
					if(ui.NewProjectDialog.checkboxes.get("Company").checked && projectCompany != "") params.push(projectCompany);
					ui.NewProjectDialog.createOpenFLProject(params);
					break;
				case "OpenFL Extension":
					ui.NewProjectDialog.createOpenFLProject(["extension",ui.NewProjectDialog.projectName.value]);
					break;
				default:
				}
				project.type = 1;
				project.target = "html5";
				project.main = "project.xml";
				break;
			case "OpenFL/Samples":
				ui.NewProjectDialog.createOpenFLProject([ui.NewProjectDialog.list.value]);
				project.type = 1;
				project.target = "html5";
				project.main = "project.xml";
				break;
			default:
			}
			var name = ui.NewProjectDialog.projectName.value;
			if(name != "") project.name = name;
			var projectPackage = ui.NewProjectDialog.textfieldsWithCheckboxes.get("Package").value;
			if(ui.NewProjectDialog.checkboxes.get("Package").checked && projectPackage != "") project.projectPackage = projectPackage;
			var company = ui.NewProjectDialog.textfieldsWithCheckboxes.get("Company").value;
			if(ui.NewProjectDialog.checkboxes.get("Company").checked && company != "") project.company = company;
			var license = ui.NewProjectDialog.textfieldsWithCheckboxes.get("License").value;
			if(ui.NewProjectDialog.checkboxes.get("License").checked && license != "") project.license = license;
			var url = ui.NewProjectDialog.textfieldsWithCheckboxes.get("URL").value;
			if(ui.NewProjectDialog.checkboxes.get("URL").checked && url != "") project.url = url;
			var path;
			if(ui.NewProjectDialog.createDirectoryForProject.checked) path = Utils.path.join(ui.NewProjectDialog.projectLocation.value,ui.NewProjectDialog.projectName.value,"project.hide"); else path = Utils.path.join(ui.NewProjectDialog.projectLocation.value,"project.hide");
			Utils.system_saveFile(path,JSON.stringify(project));
			core.ProjectAccess.currentProject = project;
			Main.updateMenu();
			ui.NewProjectDialog.saveData("Package");
			ui.NewProjectDialog.saveData("Company");
			ui.NewProjectDialog.saveData("License");
			ui.NewProjectDialog.saveData("URL");
			ui.NewProjectDialog.saveCheckboxState("Package");
			ui.NewProjectDialog.saveCheckboxState("Company");
			ui.NewProjectDialog.saveCheckboxState("License");
			ui.NewProjectDialog.saveCheckboxState("URL");
			ui.NewProjectDialog.saveCheckboxState("CreateDirectory");
			ui.NewProjectDialog.hide();
		}
	});
}
ui.NewProjectDialog.createDirectory = function(path,onCreated) {
	Utils.fs.mkdir(path,null,function(error) {
		if(error != null) console.log(error);
		if(onCreated != null) onCreated();
	});
}
ui.NewProjectDialog.createDirectoryRecursively = function(path,folderPath,onCreated) {
	var fullPath = Utils.path.join(path,folderPath[0]);
	ui.NewProjectDialog.createDirectory(fullPath,function() {
		folderPath.splice(0,1);
		if(folderPath.length > 0) ui.NewProjectDialog.createDirectoryRecursively(fullPath,folderPath,onCreated); else onCreated();
	});
}
ui.NewProjectDialog.generateProjectName = function(onGenerated) {
	if(ui.NewProjectDialog.selectedCategory != "OpenFL/Samples") {
		var value = StringTools.replace(ui.NewProjectDialog.list.value,"+","p");
		value = StringTools.replace(value,"#","sharp");
		value = StringTools.replace(value," ","");
		if(ui.NewProjectDialog.selectedCategory != "OpenFL") value = StringTools.replace(ui.NewProjectDialog.selectedCategory,"/","") + value;
		ui.NewProjectDialog.generateFolderName(ui.NewProjectDialog.projectLocation.value,value,1,onGenerated);
	} else {
		ui.NewProjectDialog.projectName.value = ui.NewProjectDialog.list.value;
		ui.NewProjectDialog.updateHelpBlock();
		if(onGenerated != null) onGenerated();
	}
	if(ui.NewProjectDialog.selectedCategory != "Haxe") ui.NewProjectDialog.createDirectoryForProject.parentElement.parentElement.style.display = "none"; else ui.NewProjectDialog.createDirectoryForProject.parentElement.parentElement.style.display = "block";
}
ui.NewProjectDialog.show = function() {
	if(ui.NewProjectDialog.page1.style.display == "none") ui.NewProjectDialog.backButton.click();
	new $(ui.NewProjectDialog.modal).modal("show");
}
ui.NewProjectDialog.hide = function() {
	new $(ui.NewProjectDialog.modal).modal("hide");
}
ui.NewProjectDialog.createOpenFLProject = function(params) {
	var OpenFLTools = Utils.process.spawn("haxelib",["run","openfl","create"].concat(params));
	var log = "";
	OpenFLTools.stderr.setEncoding("utf8");
	OpenFLTools.stderr.on("data",function(data) {
		var str = data.toString();
		log += str;
	});
	OpenFLTools.on("close",function(code) {
		console.log("exit code: " + Std.string(code));
		console.log(log);
		var path = Utils.path.join(ui.NewProjectDialog.projectLocation.value,ui.NewProjectDialog.projectName.value);
		if(ui.NewProjectDialog.list.value != ui.NewProjectDialog.projectName.value) Utils.fs.rename(Utils.path.join(ui.NewProjectDialog.projectLocation.value,ui.NewProjectDialog.list.value),path,function(error) {
			if(error != null) console.log(error);
			core.TabsManager.openFileInNewTab(Utils.path.join(path,"Source","Main.hx"));
		}); else core.TabsManager.openFileInNewTab(Utils.path.join(path,"Source","Main.hx"));
	});
}
ui.NewProjectDialog.generateFolderName = function(path,folder,n,onGenerated) {
	if(path != "" && folder != "") Utils.fs.exists(Utils.path.join(path,folder + Std.string(n)),function(exists) {
		if(exists) ui.NewProjectDialog.generateFolderName(path,folder,n + 1,onGenerated); else {
			ui.NewProjectDialog.projectName.value = folder + Std.string(n);
			ui.NewProjectDialog.updateHelpBlock();
			if(onGenerated != null) onGenerated();
		}
	}); else {
		ui.NewProjectDialog.projectName.value = folder + Std.string(n);
		ui.NewProjectDialog.updateHelpBlock();
	}
}
ui.NewProjectDialog.loadData = function(_text) {
	var text = js.Browser.getLocalStorage().getItem(_text);
	if(text != null) ui.NewProjectDialog.textfieldsWithCheckboxes.get(_text).value = text;
}
ui.NewProjectDialog.saveData = function(_text) {
	if(ui.NewProjectDialog.checkboxes.get(_text).checked) {
		var value = ui.NewProjectDialog.textfieldsWithCheckboxes.get(_text).value;
		if(value != "") js.Browser.getLocalStorage().setItem(_text,value);
	}
}
ui.NewProjectDialog.loadCheckboxState = function(_text) {
	var text = js.Browser.getLocalStorage().getItem(_text + "Checkbox");
	if(text != null) ui.NewProjectDialog.checkboxes.get(_text).checked = JSON.parse(text);
}
ui.NewProjectDialog.saveCheckboxState = function(_text) {
	js.Browser.getLocalStorage().setItem(_text + "Checkbox",JSON.stringify(ui.NewProjectDialog.checkboxes.get(_text).checked));
}
ui.NewProjectDialog.createPage1 = function() {
	var _this = window.document;
	ui.NewProjectDialog.page1 = _this.createElement("div");
	var well;
	var _this = window.document;
	well = _this.createElement("div");
	well.className = "well";
	well.style.float = "left";
	well.style.width = "50%";
	well.style.height = "250px";
	well.style.marginBottom = "0";
	ui.NewProjectDialog.page1.appendChild(well);
	var tree;
	var _this = window.document;
	tree = _this.createElement("ul");
	tree.className = "nav nav-list";
	well.appendChild(tree);
	tree.appendChild(ui.NewProjectDialog.createCategory("Haxe"));
	tree.appendChild(ui.NewProjectDialog.createCategoryWithSubcategories("OpenFL",["Samples"]));
	ui.NewProjectDialog.list = ui.NewProjectDialog.createList();
	ui.NewProjectDialog.list.style.float = "left";
	ui.NewProjectDialog.list.style.width = "50%";
	ui.NewProjectDialog.list.style.height = "250px";
	ui.NewProjectDialog.page1.appendChild(ui.NewProjectDialog.list);
	ui.NewProjectDialog.page1.appendChild((function($this) {
		var $r;
		var _this = window.document;
		$r = _this.createElement("br");
		return $r;
	}(this)));
	var _this = window.document;
	ui.NewProjectDialog.description = _this.createElement("p");
	ui.NewProjectDialog.description.style.width = "100%";
	ui.NewProjectDialog.description.style.height = "50px";
	ui.NewProjectDialog.description.style.overflow = "auto";
	ui.NewProjectDialog.description.textContent = "Description";
	ui.NewProjectDialog.page1.appendChild(ui.NewProjectDialog.description);
	return ui.NewProjectDialog.page1;
}
ui.NewProjectDialog.createPage2 = function() {
	var _this = window.document;
	ui.NewProjectDialog.page2 = _this.createElement("div");
	ui.NewProjectDialog.page2.style.padding = "15px";
	var row;
	var _this = window.document;
	row = _this.createElement("div");
	row.className = "row";
	var _this = window.document;
	ui.NewProjectDialog.projectName = _this.createElement("input");
	ui.NewProjectDialog.projectName.type = "text";
	ui.NewProjectDialog.projectName.className = "form-control";
	ui.NewProjectDialog.projectName.placeholder = "Name";
	ui.NewProjectDialog.projectName.style.width = "100%";
	row.appendChild(ui.NewProjectDialog.projectName);
	ui.NewProjectDialog.page2.appendChild(row);
	var _this = window.document;
	row = _this.createElement("div");
	row.className = "row";
	var inputGroup;
	var _this = window.document;
	inputGroup = _this.createElement("div");
	inputGroup.className = "input-group";
	inputGroup.style.display = "inline";
	row.appendChild(inputGroup);
	var _this = window.document;
	ui.NewProjectDialog.projectLocation = _this.createElement("input");
	ui.NewProjectDialog.projectLocation.type = "text";
	ui.NewProjectDialog.projectLocation.className = "form-control";
	ui.NewProjectDialog.projectLocation.placeholder = "Location";
	ui.NewProjectDialog.projectLocation.style.width = "80%";
	inputGroup.appendChild(ui.NewProjectDialog.projectLocation);
	var browseButton;
	var _this = window.document;
	browseButton = _this.createElement("button");
	browseButton.type = "button";
	browseButton.className = "btn btn-default";
	browseButton.textContent = "Browse...";
	browseButton.style.width = "20%";
	browseButton.onclick = function(e) {
		core.FileDialog.openFolder(function(path) {
			ui.NewProjectDialog.projectLocation.value = path;
			ui.NewProjectDialog.updateHelpBlock();
			js.Browser.getLocalStorage().setItem("Location",path);
		});
	};
	inputGroup.appendChild(browseButton);
	ui.NewProjectDialog.page2.appendChild(row);
	ui.NewProjectDialog.createTextWithCheckbox(ui.NewProjectDialog.page2,"Package");
	ui.NewProjectDialog.createTextWithCheckbox(ui.NewProjectDialog.page2,"Company");
	ui.NewProjectDialog.createTextWithCheckbox(ui.NewProjectDialog.page2,"License");
	ui.NewProjectDialog.createTextWithCheckbox(ui.NewProjectDialog.page2,"URL");
	var _this = window.document;
	row = _this.createElement("div");
	row.className = "row";
	var checkboxDiv;
	var _this = window.document;
	checkboxDiv = _this.createElement("div");
	checkboxDiv.className = "checkbox";
	row.appendChild(checkboxDiv);
	var label;
	var _this = window.document;
	label = _this.createElement("label");
	checkboxDiv.appendChild(label);
	var _this = window.document;
	ui.NewProjectDialog.createDirectoryForProject = _this.createElement("input");
	ui.NewProjectDialog.createDirectoryForProject.type = "checkbox";
	ui.NewProjectDialog.createDirectoryForProject.checked = true;
	label.appendChild(ui.NewProjectDialog.createDirectoryForProject);
	ui.NewProjectDialog.checkboxes.set("CreateDirectory",ui.NewProjectDialog.createDirectoryForProject);
	ui.NewProjectDialog.createDirectoryForProject.onchange = function(e) {
		ui.NewProjectDialog.updateHelpBlock();
	};
	label.appendChild(window.document.createTextNode("Create directory for project"));
	ui.NewProjectDialog.page2.appendChild(row);
	var _this = window.document;
	row = _this.createElement("div");
	var _this = window.document;
	ui.NewProjectDialog.helpBlock = _this.createElement("p");
	ui.NewProjectDialog.helpBlock.className = "help-block";
	row.appendChild(ui.NewProjectDialog.helpBlock);
	ui.NewProjectDialog.projectLocation.onchange = function(e) {
		ui.NewProjectDialog.updateHelpBlock();
		ui.NewProjectDialog.generateFolderName(ui.NewProjectDialog.projectLocation.value,ui.NewProjectDialog.projectName.value,1);
	};
	ui.NewProjectDialog.projectName.onchange = function(e) {
		ui.NewProjectDialog.projectName.value = Utils.capitalize(ui.NewProjectDialog.projectName.value);
		ui.NewProjectDialog.updateHelpBlock();
	};
	ui.NewProjectDialog.page2.appendChild(row);
	return ui.NewProjectDialog.page2;
}
ui.NewProjectDialog.updateHelpBlock = function() {
	if(ui.NewProjectDialog.projectLocation.value != "") {
		var str = "";
		if((ui.NewProjectDialog.selectedCategory != "Haxe" || ui.NewProjectDialog.createDirectoryForProject.checked == true) && ui.NewProjectDialog.projectName.value != "") str = ui.NewProjectDialog.projectName.value;
		ui.NewProjectDialog.helpBlock.innerText = "Project will be created in: " + Utils.path.join(ui.NewProjectDialog.projectLocation.value,str);
	} else ui.NewProjectDialog.helpBlock.innerText = "";
}
ui.NewProjectDialog.createTextWithCheckbox = function(_page2,_text) {
	var row;
	var _this = window.document;
	row = _this.createElement("div");
	row.className = "row";
	var inputGroup;
	var _this = window.document;
	inputGroup = _this.createElement("div");
	inputGroup.className = "input-group";
	row.appendChild(inputGroup);
	var inputGroupAddon;
	var _this = window.document;
	inputGroupAddon = _this.createElement("span");
	inputGroupAddon.className = "input-group-addon";
	inputGroup.appendChild(inputGroupAddon);
	var checkbox;
	var _this = window.document;
	checkbox = _this.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = true;
	inputGroupAddon.appendChild(checkbox);
	ui.NewProjectDialog.checkboxes.set(_text,checkbox);
	var text;
	var _this = window.document;
	text = _this.createElement("input");
	text.type = "text";
	text.className = "form-control";
	text.placeholder = _text;
	ui.NewProjectDialog.textfieldsWithCheckboxes.set(_text,text);
	checkbox.onchange = function(e) {
		if(checkbox.checked) text.disabled = false; else text.disabled = true;
	};
	inputGroup.appendChild(text);
	_page2.appendChild(row);
}
ui.NewProjectDialog.createCategory = function(text) {
	var li;
	var _this = window.document;
	li = _this.createElement("li");
	var a;
	var _this = window.document;
	a = _this.createElement("a");
	a.href = "#";
	a.addEventListener("click",function(e) {
		var parent = li.parentElement.parentElement;
		var topA;
		topA = js.Boot.__cast(parent.getElementsByTagName("a")[0] , HTMLAnchorElement);
		if(parent.className == "well") ui.NewProjectDialog.updateListItems(a.textContent); else ui.NewProjectDialog.updateListItems(topA.innerText + "/" + a.textContent);
	});
	var span;
	var _this = window.document;
	span = _this.createElement("span");
	span.className = "glyphicon glyphicon-folder-open";
	a.appendChild(span);
	var _this = window.document;
	span = _this.createElement("span");
	span.textContent = text;
	span.style.marginLeft = "5px";
	a.appendChild(span);
	li.appendChild(a);
	return li;
}
ui.NewProjectDialog.updateListItems = function(category) {
	ui.NewProjectDialog.selectedCategory = category;
	new $(ui.NewProjectDialog.list).children().remove();
	switch(category) {
	case "Haxe":
		ui.NewProjectDialog.setListItems(ui.NewProjectDialog.list,["Flash Project","JavaScript Project","Neko Project","PHP Project","C++ Project","Java Project","C# Project"]);
		break;
	case "OpenFL":
		ui.NewProjectDialog.setListItems(ui.NewProjectDialog.list,["OpenFL Project","OpenFL Extension"]);
		break;
	case "OpenFL/Samples":
		ui.NewProjectDialog.setListItems(ui.NewProjectDialog.list,["ActuateExample","AddingAnimation","AddingText","DisplayingABitmap","HandlingKeyboardEvents","HandlingMouseEvent","HerokuShaders","PiratePig","PlayingSound","SimpleBox2D","SimpleOpenGLView"]);
		break;
	default:
	}
	ui.NewProjectDialog.checkSelectedOptions();
}
ui.NewProjectDialog.createCategoryWithSubcategories = function(text,subcategories) {
	var li = ui.NewProjectDialog.createCategory(text);
	var a;
	a = js.Boot.__cast(li.getElementsByTagName("a")[0] , HTMLAnchorElement);
	a.className = "tree-toggler nav-header";
	a.onclick = function(e) {
		new $(li).children("ul.tree").toggle(300);
	};
	var ul;
	var _this = window.document;
	ul = _this.createElement("ul");
	ul.className = "nav nav-list tree";
	li.appendChild(ul);
	li.onclick = function(e) {
		var _g = 0;
		while(_g < subcategories.length) {
			var subcategory = subcategories[_g];
			++_g;
			ul.appendChild(ui.NewProjectDialog.createCategory(subcategory));
		}
		e.stopPropagation();
		e.preventDefault();
		li.onclick = null;
		new $(ul).show(300);
	};
	return li;
}
ui.NewProjectDialog.createList = function() {
	var select;
	var _this = window.document;
	select = _this.createElement("select");
	select.size = 10;
	select.onchange = function(e) {
		ui.NewProjectDialog.checkSelectedOptions();
	};
	select.ondblclick = function(e) {
		ui.NewProjectDialog.showPage2();
	};
	return select;
}
ui.NewProjectDialog.checkSelectedOptions = function() {
	if(ui.NewProjectDialog.list.selectedOptions.length > 0) {
		var option;
		option = js.Boot.__cast(ui.NewProjectDialog.list.selectedOptions[0] , HTMLOptionElement);
		ui.NewProjectDialog.updateDescription(ui.NewProjectDialog.selectedCategory,option.label);
	}
}
ui.NewProjectDialog.updateDescription = function(category,selectedOption) {
	switch(category) {
	case "Haxe":
		switch(selectedOption) {
		case "Flash Project":
			break;
		default:
		}
		break;
	case "OpenFL":
		break;
	case "OpenFL/Samples":
		break;
	default:
	}
	ui.NewProjectDialog.description.textContent = selectedOption;
}
ui.NewProjectDialog.setListItems = function(list,items) {
	var _g = 0;
	while(_g < items.length) {
		var item = items[_g];
		++_g;
		list.appendChild(ui.NewProjectDialog.createListItem(item));
	}
	list.selectedIndex = 0;
	ui.NewProjectDialog.checkSelectedOptions();
}
ui.NewProjectDialog.createListItem = function(text) {
	var option;
	var _this = window.document;
	option = _this.createElement("option");
	option.textContent = text;
	option.value = text;
	return option;
}
ui.menu = {}
ui.menu.basic = {}
ui.menu.basic.Menu = function(_text,_headerText) {
	var _this = window.document;
	this.li = _this.createElement("li");
	this.li.className = "dropdown";
	var a;
	var _this = window.document;
	a = _this.createElement("a");
	a.href = "#";
	a.className = "dropdown-toggle";
	a.setAttribute("data-toggle","dropdown");
	a.innerText = _text;
	this.li.appendChild(a);
	var _this = window.document;
	this.ul = _this.createElement("ul");
	this.ul.className = "dropdown-menu";
	if(_headerText != null) {
		var li_header;
		var _this = window.document;
		li_header = _this.createElement("li");
		li_header.className = "dropdown-header";
		li_header.innerText = _headerText;
		this.ul.appendChild(li_header);
	}
	this.li.appendChild(this.ul);
};
ui.menu.basic.Menu.__name__ = true;
ui.menu.basic.Menu.prototype = {
	addMenuItem: function(_text,_onClickFunctionName,_onClickFunction,_hotkey) {
		this.ul.appendChild(new ui.menu.basic.MenuButtonItem(_text,_onClickFunctionName,_onClickFunction,_hotkey).getElement());
	}
	,addSeparator: function() {
		this.ul.appendChild(new ui.menu.basic.Separator().getElement());
	}
	,addToDocument: function() {
		var div;
		div = js.Boot.__cast(window.document.getElementById("position-navbar") , Element);
		div.appendChild(this.li);
	}
	,setDisabled: function(menuItemNames) {
		var childNodes = this.ul.childNodes;
		var _g1 = 0;
		var _g = childNodes.length;
		while(_g1 < _g) {
			var i = _g1++;
			var child;
			child = js.Boot.__cast(childNodes[i] , Element);
			if(child.className != "divider") {
				var a;
				a = js.Boot.__cast(child.firstChild , HTMLAnchorElement);
				if(Lambda.indexOf(menuItemNames,a.getAttribute("text")) == -1) child.className = ""; else child.className = "disabled";
			}
		}
	}
	,setMenuEnabled: function(enabled) {
		var childNodes = this.ul.childNodes;
		var _g1 = 0;
		var _g = childNodes.length;
		while(_g1 < _g) {
			var i = _g1++;
			var child;
			child = js.Boot.__cast(childNodes[i] , Element);
			if(child.className != "divider") {
				if(enabled) child.className = ""; else child.className = "disabled";
			}
		}
	}
	,__class__: ui.menu.basic.Menu
}
ui.menu.DeveloperToolsMenu = function() {
	ui.menu.basic.Menu.call(this,"Developer Tools");
	this.createUI();
};
ui.menu.DeveloperToolsMenu.__name__ = true;
ui.menu.DeveloperToolsMenu.__super__ = ui.menu.basic.Menu;
ui.menu.DeveloperToolsMenu.prototype = $extend(ui.menu.basic.Menu.prototype,{
	createUI: function() {
		this.addMenuItem("Open HIDE project","openHIDEProject",null);
		this.addMenuItem("Rebuild HIDE(and reload)","rebuildHIDE",null,"Ctrl-Shift-R");
		this.addMenuItem("Reload page","reloadHIDEPage",null);
		this.addToDocument();
	}
	,__class__: ui.menu.DeveloperToolsMenu
});
ui.menu.EditMenu = function() {
	ui.menu.basic.Menu.call(this,"Edit");
	this.createUI();
};
ui.menu.EditMenu.__name__ = true;
ui.menu.EditMenu.__super__ = ui.menu.basic.Menu;
ui.menu.EditMenu.prototype = $extend(ui.menu.basic.Menu.prototype,{
	createUI: function() {
		this.addMenuItem("Undo","component_undo",function() {
			if(core.TabsManager.curDoc != null) core.TabsManager.curDoc.doc.undo();
		},"Ctrl-Z");
		this.addMenuItem("Redo","component_redo",function() {
			if(core.TabsManager.curDoc != null) core.TabsManager.curDoc.doc.redo();
		},"Ctrl-Y");
		this.addSeparator();
		this.addMenuItem("Cut","component_cut",null,"Ctrl-X");
		this.addMenuItem("Copy","component_copy",null,"Ctrl-C");
		this.addMenuItem("Paste","component_paste",null,"Ctrl-V");
		this.addMenuItem("Delete","component_delete",null);
		this.addMenuItem("Select All","component_select_all",null,"Ctrl-A");
		this.addSeparator();
		this.addMenuItem("Find...","component_find",null,"Ctrl-F");
		this.addMenuItem("Replace...","component_replace",null,"Ctrl-H");
		this.addToDocument();
	}
	,__class__: ui.menu.EditMenu
});
ui.menu.FileMenu = function() {
	ui.menu.basic.Menu.call(this,"File");
	this.createUI();
};
ui.menu.FileMenu.__name__ = true;
ui.menu.FileMenu.__super__ = ui.menu.basic.Menu;
ui.menu.FileMenu.prototype = $extend(ui.menu.basic.Menu.prototype,{
	createUI: function() {
		this.addMenuItem("New Project...","component_projectAccess_new",core.ProjectAccess.createNewProject,"Ctrl-Shift-N");
		this.addMenuItem("New File...","component_fileAccess_new",core.FileAccess.createNewFile,"Ctrl-N");
		this.addMenuItem("Open Project...","component_projectAccess_open",core.ProjectAccess.openProject,"Ctrl-Shift-O");
		this.addMenuItem("Close Project...","component_projectAccess_close",core.ProjectAccess.closeProject);
		this.addSeparator();
		this.addMenuItem("Open File...","component_fileAccess_open",core.FileAccess.openFile,"Ctrl-O");
		this.addMenuItem("Close File","component_fileAccess_close",core.FileAccess.closeActiveFile,"Ctrl-W");
		this.addSeparator();
		this.addMenuItem("Project Properties","component_projectAccess_configure",core.ProjectAccess.configureProject);
		this.addSeparator();
		this.addMenuItem("Save","component_fileAccess_save",core.FileAccess.saveActiveFile,"Ctrl-S");
		this.addMenuItem("Save as...","component_saveAs",core.FileAccess.saveActiveFileAs,"Ctrl-Shift-S");
		this.addMenuItem("Save all","component_saveAll",core.FileAccess.saveAll);
		this.addSeparator();
		this.addMenuItem("Exit","component_exit",Main.close,"Alt-F4");
		this.addToDocument();
	}
	,__class__: ui.menu.FileMenu
});
ui.menu.HelpMenu = function() {
	ui.menu.basic.Menu.call(this,"Help");
	this.createUI();
};
ui.menu.HelpMenu.__name__ = true;
ui.menu.HelpMenu.__super__ = ui.menu.basic.Menu;
ui.menu.HelpMenu.prototype = $extend(ui.menu.basic.Menu.prototype,{
	createUI: function() {
		this.addMenuItem("About","component_about",null);
		this.addToDocument();
	}
	,__class__: ui.menu.HelpMenu
});
ui.menu.RunMenu = function() {
	ui.menu.basic.Menu.call(this,"Run");
	this.createUI();
};
ui.menu.RunMenu.__name__ = true;
ui.menu.RunMenu.__super__ = ui.menu.basic.Menu;
ui.menu.RunMenu.prototype = $extend(ui.menu.basic.Menu.prototype,{
	createUI: function() {
		this.addMenuItem("Run Project","component_run_project",BuildTools.runProject,"F5");
		this.addMenuItem("Build Project","component_build_project",BuildTools.buildProject,"F8");
		this.addToDocument();
	}
	,__class__: ui.menu.RunMenu
});
ui.menu.SourceMenu = function() {
	ui.menu.basic.Menu.call(this,"Source");
	this.createUI();
};
ui.menu.SourceMenu.__name__ = true;
ui.menu.SourceMenu.__super__ = ui.menu.basic.Menu;
ui.menu.SourceMenu.prototype = $extend(ui.menu.basic.Menu.prototype,{
	createUI: function() {
		this.addMenuItem("Format","component_format",null);
		this.addMenuItem("Toggle Comment","component_toggle_comment",null);
		this.addToDocument();
	}
	,__class__: ui.menu.SourceMenu
});
ui.menu.ViewMenu = function() {
	ui.menu.basic.Menu.call(this,"View");
	this.createUI();
};
ui.menu.ViewMenu.__name__ = true;
ui.menu.ViewMenu.__super__ = ui.menu.basic.Menu;
ui.menu.ViewMenu.prototype = $extend(ui.menu.basic.Menu.prototype,{
	createUI: function() {
		this.addMenuItem("Toggle Fullscreen","component_toggle_fullscreen",Utils.toggleFullscreen,"Shift-Alt-Enter");
		this.addToDocument();
	}
	,__class__: ui.menu.ViewMenu
});
ui.menu.basic.MenuItem = function() { }
ui.menu.basic.MenuItem.__name__ = true;
ui.menu.basic.MenuButtonItem = function(_text,_onClickFunctionName,_onClickFunction,_hotkey) {
	var _g = this;
	var span = null;
	if(_hotkey != null) {
		var _this = window.document;
		span = _this.createElement("span");
		span.style.color = "silver";
		span.style.float = "right";
		span.innerText = _hotkey;
	}
	var _this = window.document;
	this.li = _this.createElement("li");
	var a;
	var _this = window.document;
	a = _this.createElement("a");
	a.style.left = "0";
	a.setAttribute("text",_text);
	if(_onClickFunction != null) a.onclick = function(e) {
		if(_g.li.className != "disabled") new $(window.document).triggerHandler(_onClickFunctionName);
	};
	a.innerText = _text;
	if(span != null) a.appendChild(span);
	this.li.appendChild(a);
	this.registerEvent(_onClickFunctionName,_onClickFunction);
};
ui.menu.basic.MenuButtonItem.__name__ = true;
ui.menu.basic.MenuButtonItem.__interfaces__ = [ui.menu.basic.MenuItem];
ui.menu.basic.MenuButtonItem.prototype = {
	getElement: function() {
		return this.li;
	}
	,registerEvent: function(_onClickFunctionName,_onClickFunction) {
		if(_onClickFunction != null) new $(window.document).on(_onClickFunctionName,_onClickFunction);
	}
	,__class__: ui.menu.basic.MenuButtonItem
}
ui.menu.basic.Separator = function() {
	var _this = window.document;
	this.li = _this.createElement("li");
	this.li.className = "divider";
};
ui.menu.basic.Separator.__name__ = true;
ui.menu.basic.Separator.__interfaces__ = [ui.menu.basic.MenuItem];
ui.menu.basic.Separator.prototype = {
	getElement: function() {
		return this.li;
	}
	,__class__: ui.menu.basic.Separator
}
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; };
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; };
Math.NaN = Number.NaN;
Math.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
Math.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
Math.isFinite = function(i) {
	return isFinite(i);
};
Math.isNaN = function(i) {
	return isNaN(i);
};
String.prototype.__class__ = String;
String.__name__ = true;
Array.prototype.__class__ = Array;
Array.__name__ = true;
var Int = { __name__ : ["Int"]};
var Dynamic = { __name__ : ["Dynamic"]};
var Float = Number;
Float.__name__ = ["Float"];
var Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = { __name__ : ["Class"]};
var Enum = { };
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
var module, setImmediate, clearImmediate;
js.Node.setTimeout = setTimeout;
js.Node.clearTimeout = clearTimeout;
js.Node.setInterval = setInterval;
js.Node.clearInterval = clearInterval;
js.Node.global = global;
js.Node.process = process;
js.Node.require = require;
js.Node.console = console;
js.Node.module = module;
js.Node.stringify = JSON.stringify;
js.Node.parse = JSON.parse;
var version = HxOverrides.substr(js.Node.process.version,1,null).split(".").map(Std.parseInt);
if(version[0] > 0 || version[1] >= 9) {
	js.Node.setImmediate = setImmediate;
	js.Node.clearImmediate = clearImmediate;
}
PreserveWindowState.isMaximizationEvent = false;
Utils.os = js.Node.require("os");
Utils.fs = js.Node.require("fs");
Utils.path = js.Node.require("path");
Utils.process = js.Node.require("child_process");
Utils.gui = js.Node.require("nw.gui");
Utils.window = Utils.gui.Window.get();
core.TabsManager.useWorker = false;
core.TabsManager.docs = [];
Main.main();
})();
