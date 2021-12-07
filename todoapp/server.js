// 아까 설치한 라이브러리 불러줘
const express = require('express');

// 불러온 express 라이브러리로 새로운 객체 app을 만들어줘
const app = express();
app.use(express.urlencoded({extended: true}))

const MongoClient = require('mongodb').MongoClient;


// dotenv라이브러리 등록
require('dotenv').config()

// method-override
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
// view engine은 EJS를 쓰겠습니다.
app.set('view engine', 'ejs')

// 나는 static 파일을 보관하기 위해 public 폴더를 쓸거다
app.use('/public', express.static('public'))

var db;
MongoClient.connect(process.env.DB_URL, function(에러, client){
    if(에러){return console.log(에러)}
    db = client.db('todoapp');

    // ".listen(파라미터1-서버띄울 포트번호, 파라미터2-띄운 후 실행할 코드)" 으로 서버를 열 수 있다
    app.listen(process.env.PORT, function(){
        console.log('listening on 8080')
    });
})



// 누군가가 /pet으로 방문을 하면....
// pet 관련된 안내문을 띄워주자
app.get('/pet', function(요청, 응답){
    응답.send('펫용품을 쇼핑할 수 있는 페이지입니다.')
})

app.get('/beauty', function(요청, 응답){
    응답.send('뷰티용품을 쇼핑할 수 있는 페이지입니다.')
})

app.get('/', function(요청, 응답){
    응답.render('index.ejs')
})

app.get('/write', function(요청, 응답){
    응답.render('write.ejs')
})



// 누가 /list로 GET 접속하면, 실제 DB에 저장된 데이터들로 예쁘게 꾸며진 HTML을 보여줌
app.get('/list', function(요청, 응답){
    // DB에 저장된 post라는 collection안의 제목이 모든 데이터를 꺼내주세요.
    db.collection('post').find().toArray(function(에러, 결과){
        응답.render('list.ejs', {posts: 결과})
    });
})

app.get('/search', (요청, 응답)=>{

    var 검색조건 = [
      {
        $search: {
          index: 'titleSearch',
          text: {
            query: 요청.query.value,
            path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
          }
        }
      }
    ] 
    console.log(요청.query);
    db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
      console.log(결과)
      응답.render('search.ejs', {posts : 결과})
    })
  })


 


// /detaili로 접속하면 detail.ejs 보여줌
app.get('/detail/:id', function(요청, 응답){        // 어떤놈이 'detail/어쩌구'로 GET요청을 하면~
    db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){   //'요청.params.id'는, 파라미터 중 :id라는 뜻
        console.log(결과)
        응답.render('detail.ejs', { data : 결과 })
    })
    
})

app.get('/edit/:id', function(요청, 응답){
    db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){
        console.log(결과)
        응답.render('edit.ejs', {post : 결과})
    })
})

app.put('/edit', function(요청, 응답){
    // 폼에 담긴 제목데이터, 날짜데이터를 가지고 db.collection에다가 업데이트함
    // updateOne(어떤게시물수정할건지, 수정값, 콜백함수)  $set - 업데이트 해주세요. 없으면 추가해주시고요
    db.collection('post').updateOne({ _id : parseInt(요청.body.id) }, 
    { $set : { 제목:요청.body.title, 날짜:요청.body.date } }, function(에러, 결과){
        console.log('수정완료')
        응답.redirect('/list')
    })
})

// Session방식으로 로그인 기능 구현하기
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/login', function(요청, 응답){
    응답.render('login.ejs')
});

// 1. 누가 로그인하면 local방식으로 아이디/비번 인증
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'    //회원인증 실패하면 /fail로 이동
}), function(요청, 응답){
    응답.redirect('/')      //회원인증 성공하고 그러면 redirect
})

// mypage에 접속할때마다 '로그인했니' 함수 실행시켜줌
app.get('/mypage', 로그인했니, function(요청, 응답){
    console.log(요청.user)
    응답.render('mypage.ejs', {사용자: 요청.user})
})

// 미들웨어만들기
function 로그인했니(요청, 응답, next){
    if (요청.user){         // 요청.user가 있으면 next()(통과)
        next()
    } else {
        응답.send('로그인안하셨는데요?')
    }
}

// 2. 요기가 인증하는 코드
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',        //유저가 입력한 아이디/비번 항목이 뭔지 정의(name속성)
    session: true,              //로그인 후 세션을 저장할 것인지
    passReqToCallback: false,   //아이디/비번 말고도 다른 정보 검증시
}, function(입력한아이디, 입력한비번, done){
    //console.log(입력한아이디, 입력한비번)
    db.collection('login').findOne({id: 입력한아이디}, function(에러, 결과){
        // done()은 라이브러리 문법인데, 3개의 파라미터를 가질 수 있다.
        // -----> done(서버에러, 성공시 사용자 DB데이터(아이디/비번 안맞으면 false넣어야함), 에러메시지)
        if(에러) return done(에러)
        if(!결과) return done(null, false, {message: '존재하지 않는 아이디요'})
        if(입력한비번 == 결과.pw){
            return done(null, 결과)
        } else {
            return done(null, false, {message: '비번틀렸어요'})
        }
    })
}))

// 3. 인증성공하면 세션+쿠키 만들어줌

// id를 이용해서 세션을 저장시키는 코드(로그인 성공시 발동)
// 세션 데이터를 만들고 세션의 id정보를 쿠키로 보냄
passport.serializeUser(function(user, done){
    done(null, user.id)
})

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요(마이페이지 접속시 발동)
passport.deserializeUser(function(아이디, done){    //deserializeUser(): 로그인한 유저의 세션아이디를 바탕으로 개인정보를 DB에서 찾는 역할
    // DB에서 위에있는 user.id로 유저를 찾은 뒤에 유저 정보를 
    // done(null, {요기에 넣음})
    db.collection('login').findOne({id: 아이디}, function(에러, 결과){
        done(null, 결과)
    })
})

app.get('/register', function(요청, 응답){
    응답.render('register.ejs')
})

app.post('/register', function(요청, 응답){
    //누가 id, pw 로 회원가입버튼을 누르면
    // db에서 같은 id가 있는지 조회한 후,
    // 같은 id있으면 failure, 없으면 db에 저장 후 /login으로 화면이동
    db.collection('login').insertOne({id: 요청.body.id, pw: 요청.body.pw}, function(에러, 결과){
        응답.redirect('/')
    })
})

app.post('/add', function(요청, 응답){    // 누가 폼에서 /add로 POST 요청하면
    응답.send('전송완료')
    db.collection('counter').findOne({name: "게시물갯수"}, function(에러, 결과){    // DB.counter 내의 총게시물갯수를 찾음
        console.log(결과.totalPost)
        var 총게시물갯수 = 결과.totalPost       // 총게시물갯수를 변수에 저장
        var 저장할거 = { _id: 총게시물갯수 + 1, 작성자: 요청.user._id, 제목: 요청.body.title, 날짜: 요청.body.date }

        // DB.post에 새게시물 저장해주세요.
        db.collection('post').insertOne(저장할거, function(에러, 결과){
            console.log('저장완료')
            // counter라는 콜렉션에 있는 totalPist라는 항목도 1 증가시켜야함
            db.collection('counter').updateOne({name:'게시물갯수'}, { $inc : {totalPost:1}}, function(에러, 결과){
                if(에러){return console.log(에러)}
            })
        })
    });
})

app.delete('/delete', function(요청, 응답){
    console.log(요청.body);
    요청.body._id = parseInt(요청.body._id)
    //  작성자의 정보도 확인해서, 본인이 아니면 삭제 불가능하게
    var 삭제할데이터 = { _id : 요청.body._id, 작성자 : 요청.user_id }
    // 요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요
    db.collection('post').deleteOne(삭제할데이터, function(에러, 결과){
        console.log('삭제완료')
        if(에러) {console.log(에러)}
        응답.status(200).send({ message: '성공했습니다' });
    })
})

// 고객이 /경로로 요청했을 때 이런 미들웨어(방금만든 라우터) 적용해주세요~
app.use('/shop', require('./routes/shop.js'))

app.use('/board/sub', require('./routes/board.js'))

// multer 라이브러리 사용
let multer = require('multer')
var storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, './public/image')
    },
    filename : function(req, file, cb){
        cb(null, file.originalname)
    }
})

var upload = multer({storage : storage})

app.get('/upload', function(요청, 응답){
    응답.render('upload.ejs')
})

app.post('/upload', upload.single('프로필'), function(요청, 응답){
    응답.send('업로드완료')
})

app.get('/image/:imageName', function(요청, 응답){
    응답.sendFile(__dirname + '/public/image/' + 요청.params.imageName)
})

app.post('/chat', function(요청, 응답){
    db.collection('chatroom').insertOne({member: [요청.body.id, 요청.body.id], date: new Date(), title: 요청.body.title}, function(에러, 결과){
        응답.redirect('/chat')
    })
})

app.get('/chat', function(요청, 응답){
    응답.render('chat.ejs')
})