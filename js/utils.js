function hide_gui_folder(gui, folder_name, hide) {
  var folder = gui.__folders[folder_name];
  folder.domElement.parentElement.hidden = hide;
}

function hide_gui_element(gui, property, hide) {
  for (var i = 0; i < gui.__controllers.length; i++) {
    var controller = gui.__controllers[i];
    if (controller.property === property) {
      controller.domElement.parentElement.parentElement.hidden = hide;
      return;
    }
  }
}
