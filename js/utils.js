var hide_gui_folder = function(gui, folder_name, hide) {
  var folder = gui.__folders[folder_name];
  folder.domElement.parentElement.hidden = hide;
};
