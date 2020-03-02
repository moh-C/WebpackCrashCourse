const data = require('./dropdown.json');
primaryOne(data);
secondOne(data);

function primaryOne(data) {
  let first_branch = document.getElementById('first_branch_selection');
  let finalText = '<option value="null" selected>انتخاب کنید</option>';
  for (let sth in data) {
    let tempText =
      '<option value=' + sth.toString() + '>' + sth.toString() + '</option>\n';
    finalText = finalText + tempText;
  }
  first_branch.innerHTML = finalText;
}

function secondOne(data) {
  let second_branch = document.getElementById('second_branch_selection');
  let finalText = '<option value="null" selected>انتخاب کنید</option>';
  for (let something in data) {
    for (sth in data[something]) {
      let tempText =
        '<option value=' +
        sth.toString() +
        '>' +
        sth.toString() +
        '</option>\n';
      finalText = finalText + tempText;
    }
  }
  second_branch.innerHTML = finalText;
}

$(document).on('change', '#first_branch_selection', function(e) {
  let finalText = '<option value="null" selected>انتخاب کنید</option>';
  let thisOption = document.getElementById('first_branch_selection');
  let selected = thisOption.options[thisOption.selectedIndex].value;
  let second_branch = document.getElementById('second_branch_selection');
  for (let something in data) {
    for (sth in data[something]) {
      if (sth.includes(selected)) {
        let tempText =
          '<option value=' +
          sth.toString() +
          '>' +
          sth.toString() +
          '</option>\n';
        finalText = finalText + tempText;
      }
    }
  }
  second_branch.innerHTML = finalText;
});

$(document).on('change', '#second_branch_selection', function(e) {
  let thisOption = document.getElementById('second_branch_selection');
  let selected = thisOption.options[thisOption.selectedIndex].value;
  let first = document.getElementById('first_branch_selection');
  let cString = selected.slice(0, selected.length - 3);
  first.innerHTML = '<option value=' + cString + '>' + cString + '</option>\n';
});
