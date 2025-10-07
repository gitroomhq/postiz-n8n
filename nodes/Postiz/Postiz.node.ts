import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { postizApiRequest } from './GenericFunctions';

export class Postiz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Postiz',
		name: 'postiz',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:postiz.png',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Consume Postiz API',
		defaults: {
			name: 'Postiz',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'postizApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Post',
						value: 'createPost',
						description: 'Schedule a post to Postiz',
						action: 'Schedule a post to postiz',
					},
					{
						name: 'Delete Post',
						value: 'deletePost',
						description: 'Delete a post by ID',
						action: 'Delete a post by id',
					},
					{
						name: 'Generate Video',
						value: 'generateVideo',
						description: 'Generate videos with AI',
						action: 'Generate videos with AI',
					},
					{
						name: 'Get Channels',
						value: 'getIntegrations',
						description: 'Get a list of connected channels',
						action: 'Get a list of connected channels',
					},
					{
						name: 'Get Posts',
						value: 'getPosts',
						description: 'Get a list of posts',
						action: 'Get a list of posts',
					},
					{
						name: 'Upload File',
						value: 'uploadFile',
						description: 'Upload a file to Postiz',
						action: 'Upload a file to postiz',
					},
					{
						name: 'Video Function',
						value: 'videoFunction',
						description: 'Execute video-related functions like loading voices',
						action: 'Execute video related functions',
					},
				],
				default: 'createPost',
			},
			// Generate Video parameters
			{
				displayName: 'Video Type',
				name: 'videoType',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['generateVideo'],
					},
				},
				default: 'image-text-slides',
				required: true,
				description: 'Type of video to generate (e.g., image-text-slides, veo3)',
			},
			{
				displayName: 'Output Format',
				name: 'output',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['generateVideo'],
					},
				},
				options: [
					{
						name: 'Vertical',
						value: 'vertical',
					},
					{
						name: 'Horizontal',
						value: 'horizontal',
					},
				],
				default: 'vertical',
				required: true,
				description: 'Video output format',
			},
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Custom Parameter',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['generateVideo'],
					},
				},
				default: {},
				options: [
					{
						name: 'parameter',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								required: true,
								description: 'Parameter key (e.g., voice, images)',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								required: true,
								description: 'Parameter value',
							},
						],
					},
				],
				description:
					'Custom parameters for video generation (e.g., prompt: "description", voice: voice-ID, images: [{"ID":"...","path":"..."}])',
			},
			// Video Function parameters
			{
				displayName: 'Function Name',
				name: 'functionName',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['videoFunction'],
					},
				},
				default: '',
				required: true,
				description: 'Video function to execute (e.g., loadVoices)',
			},
			{
				displayName: 'Identifier',
				name: 'identifier',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['videoFunction'],
					},
				},
				default: '',
				required: true,
				description: 'Identifier for the video function (e.g., image-text-slides)',
			},
			{
				displayName: 'Additional Parameters',
				name: 'additionalParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['videoFunction'],
					},
				},
				default: {},
				options: [
					{
						name: 'parameter',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								required: true,
								description: 'Parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								required: true,
								description: 'Parameter value',
							},
						],
					},
				],
				description: 'Additional parameters for the video function',
			},
			// CreatePost parameters
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['createPost'],
					},
				},
				options: [
					{
						name: 'Draft',
						value: 'draft',
					},
					{
						name: 'Schedule',
						value: 'schedule',
					},
					{
						name: 'Now',
						value: 'now',
					},
				],
				default: 'now',
				required: true,
				description: 'Type of post to create',
			},
			{
				displayName: 'Short Link',
				name: 'shortLink',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['createPost'],
					},
				},
				default: false,
				required: true,
				description: 'Whether to use short links',
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'dateTime',
				displayOptions: {
					show: {
						operation: ['createPost'],
					},
				},
				default: '',
				required: true,
				description: 'Date and time for the post',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				placeholder: 'Add Tag',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['createPost'],
					},
				},
				default: {},
				options: [
					{
						name: 'tag',
						displayName: 'Tag',
						values: [
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								required: true,
								description: 'Tag value',
							},
							{
								displayName: 'Label',
								name: 'label',
								type: 'string',
								default: '',
								required: true,
								description: 'Tag label',
							},
						],
					},
				],
				description: 'Tags for the post',
			},
			{
				displayName: 'Posts',
				name: 'posts',
				placeholder: 'Add Post',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['createPost'],
					},
				},
				default: {},
				options: [
					{
						name: 'post',
						displayName: 'Post',
						values: [
							{
								displayName: 'Channel ID',
								name: 'integrationId',
								type: 'string',
								default: '',
								required: true,
								description:
									'ID of the channel (you can get from the get channels operation or from the Postiz UI)',
							},
							{
								displayName: 'Group',
								name: 'group',
								type: 'string',
								default: '',
								description: 'Post group',
							},
							{
								displayName: 'Settings',
								name: 'settings',
								placeholder: 'Add Setting',
								type: 'fixedCollection',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										name: 'setting',
										displayName: 'Setting',
										values: [
											{
												displayName: 'Key',
												name: 'key',
												type: 'string',
												default: '',
												required: true,
												description: 'Setting key',
											},
											{
												displayName: 'Value',
												name: 'stringValue',
												type: 'string',
												displayOptions: {
													show: {
														valueType: ['string'],
													},
												},
												default: '',
												required: true,
												description: 'String value',
											},
											{
												displayName: 'Value',
												name: 'numberValue',
												type: 'number',
												displayOptions: {
													show: {
														valueType: ['number'],
													},
												},
												default: 0,
												required: true,
												description: 'Number value',
											},
											{
												displayName: 'Value',
												name: 'booleanValue',
												type: 'boolean',
												displayOptions: {
													show: {
														valueType: ['boolean'],
													},
												},
												default: false,
												required: true,
												description: 'Whether the setting is enabled',
											},
											{
												displayName: 'Value',
												name: 'jsonValue',
												type: 'json',
												displayOptions: {
													show: {
														valueType: ['json'],
													},
												},
												default: '',
												required: true,
												description: 'JSON value (object or array)',
											},
											{
												displayName: 'Value Type',
												name: 'valueType',
												type: 'options',
												options: [
													{
														name: 'String',
														value: 'string',
													},
													{
														name: 'Number',
														value: 'number',
													},
													{
														name: 'Boolean',
														value: 'boolean',
													},
													{
														name: 'JSON',
														value: 'json',
													},
												],
												default: 'string',
												required: true,
												description: 'Type of the setting value',
											},
										],
									},
								],
								description: 'Provider-specific settings',
							},
							{
								displayName: 'Content Items',
								name: 'value',
								placeholder: 'Add Content Item',
								type: 'fixedCollection',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										name: 'contentItem',
										displayName: 'Content Item',
										values: [
											{
												displayName: 'Content',
												name: 'content',
												type: 'string',
												typeOptions: {
													rows: 4,
												},
												default: '',
												required: true,
												description: 'Content text',
											},
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												description: 'Content ID (optional)',
											},
											{
												displayName: 'Images',
												name: 'image',
												placeholder: 'Add Image',
												type: 'fixedCollection',
												typeOptions: {
													multipleValues: true,
												},
												default: {},
												options: [
													{
														name: 'imageItem',
														displayName: 'Image',
														values: [
															{
																displayName: 'ID',
																name: 'id',
																type: 'string',
																default: '',
																required: true,
																description: 'Image ID',
															},
															{
																displayName: 'Path',
																name: 'path',
																type: 'string',
																default: '',
																required: true,
																description: 'Image path/URL',
															},
														],
													},
												],
												description: 'Images for this content item',
											},
										],
									},
								],
								description: 'Content items (value array)',
							},
						],
					},
				],
				description: 'Posts array (required for non-draft)',
			},
			// GetPosts parameters
			{
				displayName: 'Start Date (UTC)',
				name: 'startDate',
				type: 'dateTime',
				displayOptions: {
					show: {
						operation: ['getPosts'],
					},
				},
				default: '',
				required: true,
				description: 'Start date for filtering posts (UTC)',
			},
			{
				displayName: 'End Date (UTC)',
				name: 'endDate',
				type: 'dateTime',
				displayOptions: {
					show: {
						operation: ['getPosts'],
					},
				},
				default: '',
				required: true,
				description: 'End date for filtering posts (UTC)',
			},
			{
				displayName: 'Customer',
				name: 'customer',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getPosts'],
					},
				},
				default: '',
				description: 'Customer ID for filtering posts (optional)',
			},
			// UploadFile parameters
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['uploadFile'],
					},
				},
				default: '',
				required: true,
				description: 'Name of the binary property that contains the file data',
			},
			// DeletePost parameters
			{
				displayName: 'Post ID',
				name: 'postId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['deletePost'],
					},
				},
				default: '',
				required: true,
				description: 'ID of the post to delete',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let responseData: any = undefined;

		for (let i = 0; i < length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);

				if (operation === 'createPost') {
					// Map CreatePostDto fields exactly
					const type = this.getNodeParameter('type', i) as string;
					const shortLink = this.getNodeParameter('shortLink', i) as boolean;
					const date = this.getNodeParameter('date', i) as string;

					// Get array parameters
					const tagsParam = this.getNodeParameter('tags', i, {}) as any;
					const postsParam = this.getNodeParameter('posts', i, {}) as any;

					// Process tags array
					const tags = tagsParam.tag
						? tagsParam.tag.map((tag: any) => ({
								value: tag.value,
								label: tag.label,
							}))
						: [];

					// Process posts array
					const posts = postsParam.post
						? postsParam.post.map((post: any) => {
								// Process settings for this post
								const settings: any = {};

								if (post.settings?.setting && post.settings.setting.length > 0) {
									post.settings.setting.forEach((setting: any) => {
										// Determine the actual value based on the selected type
										let value;
										switch (setting.valueType) {
											case 'string':
												value = setting.stringValue;
												break;
											case 'number':
												value = setting.numberValue;
												break;
											case 'boolean':
												value = setting.booleanValue;
												break;
											case 'json':
												try {
													value = JSON.parse(setting.jsonValue);
												} catch {
													value = setting.jsonValue;
												}
												break;
											default:
												value = setting.stringValue; // fallback to string
										}
										settings[setting.key] = value;
									});
								}

								// Process value array (PostContent[])
								const value = post.value?.contentItem
									? post.value.contentItem.map((item: any) => ({
											content: item.content,
											id: item.id || '',
											image: item.image?.imageItem
												? item.image.imageItem.map((img: any) => ({
														id: img.id,
														path: img.path,
													}))
												: [],
										}))
									: [];

								return {
									integration: {
										id: post.integrationId,
									},
									value,
									group: post.group || '',
									settings,
								};
							})
						: [];

					const body = {
						type,
						shortLink,
						date,
						tags,
						posts,
					};

					responseData = await postizApiRequest.call(this, 'POST', '/posts', body);
				}

				if (operation === 'getPosts') {
					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					const customer = this.getNodeParameter('customer', i) as string;

					const query = {
						startDate,
						endDate,
						...(customer && { customer }),
					};

					responseData = await postizApiRequest.call(this, 'GET', '/posts', {}, query);
				}

				if (operation === 'uploadFile') {
					const binaryPropertyName = this.getNodeParameter('binaryProperty', i) as any;
					const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
					const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					const mimeType = binaryData.mimeType || 'application/octet-stream';

					if (
						!dataBuffer ||
						!binaryData
					) {
						throw new NodeOperationError(
							this.getNode(),
							`Item is not of type "binary" or does not contain the expected properties: data, mimeType, fileName`,
							{ itemIndex: i },
						);
					}

					const blob = new Blob([dataBuffer], {
						type: mimeType,
					});

					const formData = new FormData();
					formData.append('file', blob, binaryData.fileName);
					responseData = await postizApiRequest.call(this, 'POST', '/upload', formData);
				}

				if (operation === 'getIntegrations') {
					responseData = await postizApiRequest.call(this, 'GET', '/integrations');
				}

				if (operation === 'deletePost') {
					const postId = this.getNodeParameter('postId', i) as string;
					responseData = await postizApiRequest.call(this, 'DELETE', `/posts/${postId}`);
				}

				if (operation === 'generateVideo') {
					const videoType = this.getNodeParameter('videoType', i) as string;
					const output = this.getNodeParameter('output', i) as string;
					const customParametersParam = this.getNodeParameter('customParameters', i, {}) as any;

					const body: any = {
						type: videoType,
						output,
						customParams: {},
					};

					// Add custom parameters dynamically
					if (customParametersParam.parameter && customParametersParam.parameter.length > 0) {
						customParametersParam.parameter.forEach((param: any) => {
							// Try to parse JSON values, otherwise use as string
							try {
								body.customParams[param.key] = JSON.parse(param.value);
							} catch {
								body.customParams[param.key] = param.value;
							}
						});
					}

					responseData = await postizApiRequest.call(this, 'POST', '/generate-video', body);
				}

				if (operation === 'videoFunction') {
					const functionName = this.getNodeParameter('functionName', i) as string;
					const identifier = this.getNodeParameter('identifier', i) as string;
					const additionalParametersParam = this.getNodeParameter(
						'additionalParameters',
						i,
						{},
					) as any;

					const body: any = {
						functionName,
						identifier,
					};

					// Add additional parameters dynamically
					if (
						additionalParametersParam.parameter &&
						additionalParametersParam.parameter.length > 0
					) {
						additionalParametersParam.parameter.forEach((param: any) => {
							body[param.key] = param.value;
						});
					}

					responseData = await postizApiRequest.call(this, 'POST', '/video/function', body);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					// Continue processing other items, add error info to results
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error?.description || error?.message || error }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				// If continueOnFail is false, throw the error to stop execution
				throw error;
			}
		}

		return [returnData];
	}
}
