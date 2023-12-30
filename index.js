const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const url = "https://s.cafef.vn/screener.aspx";

const stockTypes = ["upcom", "hsx", "hnx"];

const getHtmlData = async () => {
  const { data } = await axios.get(url);
  return data;
};

const crawlData = async () => {
  const data = await getHtmlData();
  const $ = cheerio.load(data);

  // Extract all script tags
  const scriptTags = $("script");

  // Iterate over the script tags and print their content or attributes
  scriptTags.each((index, element) => {
    // If you want to print the content inside the script tag
    if ($(element).html().includes("var jsonData =")) {
      const listJsonData = $(element)
        .html()
        .split("var jsonData =")[1]
        .split(";")[0]
        .split("[")[1]
        .split("]")[0]
        .split("},");

      const jsonData = listJsonData.map((item, idx) => {
        if (idx === listJsonData.length - 1) {
          return JSON.parse(item.replace(/(-?)Infinity|NaN/g, "null"));
        }
        return JSON.parse(item.replace(/(-?)Infinity|NaN/g, "null") + "}");
      });

      stockTypes.forEach((stockType) => {
        const data = jsonData.filter((item) =>
          item.CenterName.toLowerCase().includes(stockType.toLowerCase())
        );
        updateDataInJsonFile(stockType, data);
      });
    }
  });
};

const updateDataInJsonFile = (stockType, datas) => {
  const filePath = path.join(__dirname, `./data/${stockType}.json`);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // File không tồn tại, tạo file mới với nội dung là []
        const initialData = [];
        fs.writeFile(filePath, JSON.stringify(initialData), (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("File created with initial data");
          }
        });
      } else {
        console.log(err);
      }
    } else {
      fileData = JSON.parse(data);
      fileData = [...fileData, ...datas];
      fs.writeFile(filePath, JSON.stringify(fileData), (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Data written to file");
        }
      });
    }
  });
};

const init = () => {
  setInterval(() => {
    crawlData();
  }, 5 * 60 * 1000); // 5 phút
};

init();
