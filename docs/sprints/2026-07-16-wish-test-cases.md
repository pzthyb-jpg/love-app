# 许愿池测试案例

| 编号 | 名称 | 操作 | 预期结果 |
|------|------|------|---------|
| TC-W01 | 添加许愿（wish） | 点击填写愿望内容→选类型wish→保存 | DB: status=pending, title=内容 | 列表显示该愿望 |
| TC-W02 | 添加吐槽（vent） | 填写吐槽内容→选类型vent→保存 | DB: status=vent, title=内容 | 列表显示该吐槽 |
| TC-W03 | 空内容保存 | 不填内容直接保存 | 提示"请输入内容" | 不跳转 |
| TC-W04 | 内容超长（>200字） | 输入201字 | maxlength截断为200字 |
| TC-W05 | 实现愿望 | 点击实现愿望按钮 | DB status→fulfilled, fulfilledBy=用户名 | 显示"已实现" |
| TC-W06 | 取消实现 | 点击取消实现 | DB status→pending | 恢复显示 |
| TC-W07 | 删除愿望 | 删除按钮→确认 | DB删除该条记录 | 列表移除 |
| TC-W08 | 取消删除 | 删除按钮→取消 | 愿望仍在列表 | 数据不丢失 |
| TC-W09 | 筛选-全部 | 点击"🌊 全部" tab | 显示所有愿望 | 无过滤 |
| TC-W10 | 筛选-愿望 | 点击"✨ 愿望" tab | 只显示wish类型 | vent被过滤 |
| TC-W11 | 筛选-吐槽 | 点击"😤 吐槽" tab | 只显示vent类型 | wish被过滤 |
| TC-W12 | 筛选-已实现 | 点击"✅ 已实现" tab | 只显示fulfilled状态 | 其他被过滤 |
| TC-W13 | 持久化 | 刷新页面 | 愿望数据不丢失 | 列表仍在 |
| TC-W14 | 数据映射-文本读取 | 愿望显示文本 | DB title → 前端 text | 文本正确 |
| TC-W15 | 数据映射-时间显示 | 愿望显示时间 | DB created_at → timeStr | HH:mm格式 |
| TC-W16 | 数据映射-日期显示 | 愿望显示日期 | DB created_at → dateStr | YYYY-MM-DD格式 |
| TC-W17 | 未登录访问 | 清除localStorage后访问/wish | 跳转/login | 路由守卫 |
| TC-W18 | 空状态 | 无愿望时 | 显示🌈 + "还没有内容哦" + CTA |
