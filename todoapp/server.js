// 아까 설치한 라이브러리 불러줘
const express = require('express');

// 불러온 express 라이브러리로 새로운 객체 app을 만들어줘
const app = express();
app.use(express.urlencoded({extended: true}))

const MongoClient = require('mongodb').MongoClient;

// view engine은 EJS를 쓰겠습니다.
app.set('view engine', 'ejs')

var db;
MongoClient.connect('mongodb+srv://wngkfla01:danger731@cluster0.nruve.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(에러, client){
    if(에러){return console.log(에러)}
    db = client.db('todoapp');

    // ".listen(파라미터1-서버띄울 포트번호, 파라미터2-띄운 후 실행할 코드)" 으로 서버를 열 수 있다
    app.listen(8080, function(){
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
    응답.sendFile(__dirname + '/index.html')
})

app.get('/write', function(요청, 응답){
    응답.sendFile(__dirname + '/write.html')
})

app.post('/add', function(요청, 응답){    // 누가 폼에서 /add로 POST 요청하면
    응답.send('전송완료')
    db.collection('counter').findOne({name: "게시물갯수"}, function(에러, 결과){    // DB.counter 내의 총게시물갯수를 찾음
        console.log(결과.totalPost)
        var 총게시물갯수 = 결과.totalPost       // 총게시물갯수를 변수에 저장

        // DB.post에 새게시물 저장해주세요.
        db.collection('post').insertOne({ _id: 총게시물갯수 + 1, 제목: 요청.body.title, 날짜: 요청.body.date}, function(에러, 결과){
            console.log('저장완료')
            // counter라는 콜렉션에 있는 totalPist라는 항목도 1 증가시켜야함
            db.collection('counter').updateOne({name:'게시물갯수'}, { $inc : {totalPost:1}}, function(에러, 결과){
                if(에러){return console.log(에러)}
            })
        })
    });
})

// 누가 /list로 GET 접속하면, 실제 DB에 저장된 데이터들로 예쁘게 꾸며진 HTML을 보여줌
app.get('/list', function(요청, 응답){
    // DB에 저장된 post라는 collection안의 제목이 모든 데이터를 꺼내주세요.
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과)
        응답.render('list.ejs', {posts: 결과})
    });
})

app.delete('/delete', function(요청, 응답){
    console.log(요청.body);
    요청.body._id = parseInt(요청.body._id)
    // 요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요
    db.collection('post').deleteOne(요청.body, function(에러, 결과){
        console.log('삭제완료')
        응답.status(200).send({ message: '성공했습니다' });
    })

})

// /detaili로 접속하면 detail.ejs 보여줌
app.get('/detail/:id', function(요청, 응답){        // 어떤놈이 'detail/어쩌구'로 GET요청을 하면~
    db.collection('post').findOne({_id : 요청.params.id}, function(에러, 결과){   //'요청.params.id'는, 파라미터 중 :id라는 뜻
        console.log(결과)
        응답.render('detail.ejs', { data : 결과 })
    })
    
})