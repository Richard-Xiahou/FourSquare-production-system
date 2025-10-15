import axios from "axios";


// 获取最新的设备信息 使其返回axios.get的Promise
export async function getLastDevicelnfo(params: any) {
    try {
      const response = await axios.get('/dev—api/sifang/productlnfo/lastDevicelnfolist',{params});
      return response.data; // 返回获取到的用户数据
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error; // 重新抛出错误，以便在调用处可以处理
    }
  }

  

/*
// 使用示例
(async () => {
  try {
    const params = { userId: 123, includeDetails: true };
    const res = await fetchUserData(params);
    console.log(res);
  } catch (error) {
    console.error('Error during fetching data:', error);
  }
})();
*/