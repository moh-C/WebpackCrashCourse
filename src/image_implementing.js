const data = require('./data.json');


let image = document.getElementsByClassName('image-data-panel')[0];

for (let sth in data) {
  let link = data[sth]['link'];
  for (let i = 0; i < 2; i++) {
    let temp = document.createElement('div');
    let tempImage = document.createElement('img');
    tempImage.src = link;
    temp.appendChild(tempImage);
    image.append(temp);
  }
}

