var router = require('express').Router(); // npm으로 설치했던 express라이브러리의 Router()라는 함수 쓰겠습니다

router.get('/sports', function(요청, 응답){
    응답.send('스포츠 게시판')
})

router.get('/game', function(요청, 응답){
    응답.send('게임 게시판')
})

module.exports = router