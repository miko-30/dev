function greet() {
    const name = document.getElementById("nameInput").value;

    if (name) {
        alert(name + "さん、こんにちは！");
    }   else    {
        alert("名前を入力してください");
    }
}
