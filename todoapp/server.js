// 아까 설치한 라이브러리 불러줘
const express = require('express');

// 불러온 express 라이브러리로 새로운 객체 app을 만들어줘
const app = express();

// ".listen(파라미터1-서버띄울 포트번호, 파라미터2-띄운 후 실행할 코드)" 으로 서버를 열 수 있다
app.listen(8080, function(){
    console.log('listening on 8080')
});