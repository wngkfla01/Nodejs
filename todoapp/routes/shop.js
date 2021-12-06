var router = require('express').Router(); // npm으로 설치했던 express라이브러리의 Router()라는 함수 쓰겠습니다

function 로그인했니(요청, 응답, next){
    if (요청.user){         // 요청.user가 있으면 next()(통과)
        next()
    } else {
        응답.send('로그인안하셨는데요?')
    }
}

// 여기있는 모든 URL에 적용할 미들웨어
router.use(로그인했니)

router.get('/shirts', 로그인했니, function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.')
})

router.get('/pants', 로그인했니, function(요청, 응답){
    응답.send('바지 파는 페이지입니다.')
})

module.exports = router; //router라는 변수를 배출하겠습니다