import React, {useState, useEffect} from "react";
import {Principal} from "@dfinity/principal";
import Item from "./Item";

function Gallery({title, nftIDs, role}) {
  const [userNFTs, setUserNFTs] = useState(nftIDs);


  return (
    <div className="gallery-view">
      <h3 className="makeStyles-title-99 Typography-h3">{title}</h3>
      <div className="disGrid-root disGrid-container disGrid-spacing-xs-2">
        <div className="disGrid-root disGrid-item disGrid-grid-xs-12">
          <div className="disGrid-root disGrid-container disGrid-spacing-xs-5 disGrid-justify-content-xs-center">
          {
            userNFTs.map((nft, index) => (
              <Item key={index} id={nft.toText()} role={role}/>
            ))
          }
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;
