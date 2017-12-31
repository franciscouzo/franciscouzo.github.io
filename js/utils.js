function hide_gui_folder(gui, folder_name, hide) {
  var folder = gui.__folders[folder_name];
  folder.domElement.parentElement.hidden = hide;
};
