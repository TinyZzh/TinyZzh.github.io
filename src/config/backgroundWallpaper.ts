import type { BackgroundWallpaperConfig } from "@/types/config";

export const backgroundWallpaper: BackgroundWallpaperConfig = {
	// 壁纸模式："banner" 横幅壁纸，"fullscreen" 全屏壁纸，"overlay" 全屏透明，"none" 纯色背景无壁纸
	mode: "banner",
	switchable: false,
	src: {
		desktop: "assets/images/DesktopWallpaper/page_background_3.jpg",
		mobile: "assets/images/DesktopWallpaper/page_background_3.jpg",
	},
	// 横幅壁纸和全屏壁纸共享配置
	common: {
		// 横幅文字遮罩暗度，0-1之间，值越大越暗
		dimOpacity: 0.2,
		// 主页横幅文字
		homeText: {
			enable: true,
			switchable: false,
			title: "TinyZ's Blog",
			titleSize: "3.8rem",
			subtitle: [
				"专注于网络游戏前后端技术",
				"积累技术,记录分享",
				"Java | PHP | Unity3D | Unreal Engine",
			],
			subtitleSize: "1.5rem",
			typewriter: {
				// 是否启用打字机效果
				// 打字机开启 → 循环显示所有副标题
				// 打字机关闭 → 每次刷新随机显示一条副标题
				enable: true,
				// 打字速度（毫秒）
				speed: 100,
				// 删除速度（毫秒）
				deleteSpeed: 50,
				// 完全显示后的暂停时间（毫秒）
				pauseTime: 2000,
			},
		},
		// 导航栏配置
		navbar: {
			// 导航栏透明模式："semi" 半透明，"full" 完全透明，"semifull" 动态透明
			transparentMode: "semi",
			// 是否开启毛玻璃模糊效果，开启可能会影响页面性能，如果不开启则是半透明，请根据自己的喜好开启
			enableBlur: true,
			// 毛玻璃模糊度
			blur: 5,
		},
		// 水波纹动画效果配置，开启会影响页面性能，请根据自己的喜好开启
		waves: {
			enable: {
				// 桌面端是否启用水波纹动画效果
				desktop: true,
				// 移动端是否启用水波纹动画效果
				mobile: true,
			},
			// 是否允许用户通过控制面板切换水波纹动画
			switchable: true,
		},
		// 渐变过渡效果配置，当水波纹关闭时自动启用，提供壁纸底部到背景色的平滑过渡
		gradient: {
			enable: {
				// 桌面端是否启用渐变过渡
				desktop: true,
				// 移动端是否启用渐变过渡
				mobile: true,
			},
			// 渐变高度
			height: "15vh",
			// 是否允许用户通过控制面板切换渐变过渡
			switchable: true,
		},
	},
	// Banner模式特有配置
	banner: {
		// 图片位置
		// 支持所有CSS object-position值，如: 'top', 'center', 'bottom', 'left top', 'right bottom', '25% 75%', '10px 20px'..
		// 如果不知道怎么配置百分百之类的配置，推荐直接使用：'center'居中，'top'顶部居中，'bottom' 底部居中，'left'左侧居中，'right'右侧居中
		position: "0% 20%",
		// 横幅图片轮播配置，仅在当配置多张图片时生效
		carousel: {
			// 是否启用横幅图片轮播；关闭时保持每次刷新随机显示一张
			// 开启轮播可能会有点奇怪，为了让图片之间的切换自然，图片会在下一张加载完成后，当前图片才会消失，所以会导致过渡有重影，可能会影响观感
			// 目前还没有找到更好的过渡效果方案，所以如果你觉得轮播切换时的过渡效果不好，可以考虑关闭轮播，保持每次刷新随机显示一张图片
			// 反正我目前不是很满意这个过渡效果，所以默认关闭了，如果你有更好的过渡效果方案，欢迎提交PR改进这个功能
			enable: false,
			// 轮播切换间隔（毫秒）
			interval: 5000,
			// 是否允许用户通过控制面板切换横幅轮播
			switchable: false,
		},
	},
	// 全屏透明覆盖模式特有配置
	overlay: {
		// 是否允许用户通过控制面板调整全屏透明模式参数
		switchable: {
			opacity: true,
			blur: true,
			cardOpacity: true,
		},
		// 层级，确保壁纸在背景层
		zIndex: -1,
		// 壁纸透明度
		opacity: 0.8,
		// 背景模糊度
		blur: 10,
		// 卡片透明度，0-1之间，值越小越透明
		cardOpacity: 0.5,
	},
	// 全屏壁纸模式特有配置
	fullscreen: {
		// 图片位置
		position: "center",
	},
};
