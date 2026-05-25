import type { ProfileConfig } from "../types/config";

export const profileConfig: ProfileConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.webp"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.webp"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	avatar: "assets/images/author_pic.jpg",

	// 名字
	name: "TinyZ Zzh",

	// 个人签名
	bio: "专注于高并发服务器、网络游戏相关(Java、PHP、Unity3D、Unreal Engine等)技术，热爱游戏事业, 正在努力实现自我价值当中。",

	// 链接配置
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/TinyZzh",
			showName: false,
		},
		{
			name: "LinkedIn",
			icon: "fa7-brands:linkedin",
			url: "https://in.linkedin.com/in/灼华-周-79326a116",
			showName: false,
		},
		{
			name: "Email",
			icon: "fa7-solid:envelope",
			url: "mailto:tinyzzh815@gmail.com",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
	],
};
