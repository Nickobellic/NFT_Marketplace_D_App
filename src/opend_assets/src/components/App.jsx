import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import Item from "./Item";
function App() {

  const nftID = "rkp4c-7iaaa-aaaaa-aaaca-cai";
 

  return (
    <div className="App">
      <Header />

      {/* <Item id={nftID}/> */}

      <Footer />
    </div>
  );
}

export default App;
