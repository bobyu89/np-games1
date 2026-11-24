// 自由作答的鑑別診斷：玩家先不看四盞燈、自己寫下想到的診斷，再對到這一隻劫影的四個方向。
// 一個方向底下寫它涵蓋的具體診斷（中文、英文、常見縮寫）。只比對字，不判斷寫得好不好；不計分。
// 同一隻劫影裡，一個寫法只能出現在一個方向（測試會擋）。英文和縮寫照整個字比對，中文照包含比對。
// 每個方向的名字（例如「血管急症」）本身也算，不用重寫。

export const ALIASES: Record<string, Record<string, string[]>> = {
  'chest-pain': {
    cardiac: ['心肌梗塞', '心梗', '冠心症', '冠狀動脈', '急性冠心症', '心絞痛', '狹心症', '心肌缺血', 'acs', 'mi', 'stemi', 'nstemi', 'angina', 'unstable angina', 'myocardial infarction', 'acute coronary syndrome', 'cad'],
    vascular: ['主動脈剝離', '剝離', '肺栓塞', '肺動脈栓塞', '肺血栓', '主動脈瘤', 'aortic dissection', 'dissection', 'pe', 'pulmonary embolism', 'aaa'],
    tumor: ['肺癌', '肺腫瘤', '縱膈腔腫瘤', '縱膈腫瘤', '腫瘤', '惡性', '轉移', 'lung cancer', 'mediastinal mass', 'malignancy', 'metastasis'],
    msk: ['肌肉拉傷', '肋軟骨炎', '肋骨骨折', '胸壁痛', '胸壁', '拉傷', '肌肉骨骼', 'costochondritis', 'tietze', 'chest wall pain', 'muscle strain', 'rib fracture', 'msk'],
  },
  dyspnea: {
    cardiac: ['心衰竭', '心臟衰竭', '肺水腫', '充血性心衰竭', '心因性肺水腫', 'chf', 'hf', 'heart failure', 'pulmonary edema', 'adhf'],
    airway: ['慢性阻塞性肺病', '肺阻塞', '氣喘', '哮喘', '支氣管痙攣', '急性惡化', 'copd', 'aecopd', 'asthma', 'bronchospasm'],
    infect: ['肺炎', '吸入性肺炎', '肺部感染', '下呼吸道感染', 'pneumonia', 'cap', 'hap', 'lrti'],
    sudden: ['氣胸', '張力性氣胸', '肺栓塞', '肺動脈栓塞', '肺血栓', 'pneumothorax', 'tension pneumothorax', 'pe', 'pulmonary embolism'],
  },
  abdomen: {
    biliary: ['膽結石', '膽囊炎', '膽管炎', '膽絞痛', '膽道', '膽囊', 'cholecystitis', 'cholelithiasis', 'cholangitis', 'biliary colic', 'gallstone'],
    pancreas: ['胰臟炎', '胰腺炎', '消化性潰瘍', '胃潰瘍', '十二指腸潰瘍', '潰瘍穿孔', '胃炎', 'pancreatitis', 'peptic ulcer', 'pud', 'perforated ulcer', 'gastritis'],
    appendix: ['闌尾炎', '盲腸炎', '闌尾', '盲腸', 'appendicitis'],
    diverticulum: ['憩室炎', '憩室', 'diverticulitis', 'diverticulum'],
  },
  fever: {
    lung: ['肺炎', '支氣管炎', '呼吸道感染', '上呼吸道感染', '流感', '肺結核', 'pneumonia', 'bronchitis', 'uri', 'urti', 'lrti', 'influenza', 'tb', 'tuberculosis'],
    urinary: ['泌尿道感染', '尿路感染', '腎盂腎炎', '膀胱炎', '攝護腺炎', 'uti', 'pyelonephritis', 'cystitis', 'prostatitis'],
    skin: ['蜂窩性組織炎', '蜂窩組織炎', '傷口感染', '膿瘍', '壞死性筋膜炎', '軟組織感染', 'cellulitis', 'abscess', 'wound infection', 'necrotizing fasciitis', 'ssti'],
    other: ['藥物熱', '藥物', '腫瘤熱', '淋巴瘤', '自體免疫', '血栓', '深部靜脈栓塞', '甲狀腺風暴', '非感染', 'drug fever', 'lymphoma', 'autoimmune', 'dvt', 'thyroid storm', 'vasculitis'],
  },
  headache: {
    primary: ['偏頭痛', '緊縮型頭痛', '緊張型頭痛', '叢發性頭痛', '原發性', 'migraine', 'tension headache', 'tension-type headache', 'cluster headache'],
    bleed: ['蜘蛛膜下腔出血', '腦出血', '顱內出血', '出血性中風', '動脈瘤破裂', 'sah', 'ich', 'subarachnoid hemorrhage', 'intracerebral hemorrhage'],
    infect: ['腦膜炎', '腦炎', '中樞神經感染', '腦膿瘍', 'meningitis', 'encephalitis', 'brain abscess', 'cns infection'],
    pressure: ['腦瘤', '顱內腫瘤', '硬腦膜下出血', '硬膜下血腫', '慢性硬腦膜下', '水腦', '顱內壓', '佔位', 'brain tumor', 'subdural', 'sdh', 'hydrocephalus', 'iicp', 'increased intracranial pressure', 'space-occupying lesion'],
  },
  'back-pain': {
    msk: ['肌肉拉傷', '下背痛', '扭傷', '勞損', '肌筋膜', '拉傷', 'lumbar strain', 'muscle strain', 'mechanical back pain', 'sprain'],
    urinary: ['腎結石', '輸尿管結石', '泌尿道結石', '結石', '腎盂腎炎', '腎絞痛', 'renal stone', 'ureteral stone', 'urolithiasis', 'nephrolithiasis', 'renal colic', 'pyelonephritis'],
    spine: ['馬尾症候群', '壓迫性骨折', '脊椎骨折', '脊椎感染', '硬脊膜外膿瘍', '骨髓炎', '脊椎轉移', '椎間盤突出', '坐骨神經', 'cauda equina', 'compression fracture', 'vertebral fracture', 'epidural abscess', 'osteomyelitis', 'spinal metastasis', 'disc herniation', 'hivd'],
    vascular: ['腹主動脈瘤', '主動脈瘤破裂', '主動脈剝離', '主動脈瘤', '剝離', 'aaa', 'ruptured aaa', 'abdominal aortic aneurysm', 'aortic dissection'],
  },
  'leg-pain': {
    vascular: ['急性肢體缺血', '肢體缺血', '周邊動脈疾病', '動脈阻塞', '深部靜脈栓塞', '深部靜脈血栓', '靜脈栓塞', 'ali', 'acute limb ischemia', 'pad', 'peripheral arterial disease', 'dvt', 'deep vein thrombosis'],
    joint: ['痛風', '化膿性關節炎', '敗血性關節炎', '關節炎', '假性痛風', 'gout', 'septic arthritis', 'pseudogout', 'arthritis'],
    bone: ['腔室症候群', '骨折', '肌肉拉傷', '拉傷', '橫紋肌溶解', 'compartment syndrome', 'fracture', 'muscle strain', 'rhabdomyolysis'],
    nerve: ['坐骨神經痛', '周邊神經病變', '神經病變', '神經根病變', '椎間盤突出', 'sciatica', 'peripheral neuropathy', 'neuropathy', 'radiculopathy'],
  },
  swelling: {
    cardiac: ['心衰竭', '心臟衰竭', '充血性心衰竭', 'chf', 'hf', 'heart failure'],
    renal: ['腎病症候群', '腎衰竭', '急性腎損傷', '慢性腎臟病', '腎絲球腎炎', '蛋白尿', 'nephrotic syndrome', 'renal failure', 'aki', 'ckd', 'glomerulonephritis'],
    hepatic: ['肝硬化', '腹水', '肝衰竭', '低白蛋白', 'cirrhosis', 'ascites', 'liver failure', 'hypoalbuminemia'],
    local: ['深部靜脈栓塞', '深部靜脈血栓', '蜂窩性組織炎', '蜂窩組織炎', '淋巴水腫', '靜脈功能不全', '貝克氏囊腫', 'dvt', 'deep vein thrombosis', 'cellulitis', 'lymphedema', 'venous insufficiency', "baker's cyst"],
  },
  excreta: {
    upper: ['上消化道出血', '消化性潰瘍', '胃潰瘍', '十二指腸潰瘍', '食道靜脈瘤', '靜脈瘤', '黑便', '吐血', 'ugib', 'upper gi bleeding', 'peptic ulcer', 'pud', 'varices', 'melena', 'hematemesis'],
    lower: ['下消化道出血', '痔瘡', '憩室出血', '大腸癌', '直腸癌', '大腸腫瘤', '血便', '缺血性腸炎', 'lgib', 'lower gi bleeding', 'hemorrhoid', 'diverticular bleeding', 'colorectal cancer', 'hematochezia', 'ischemic colitis'],
    urinary: ['血尿', '泌尿道結石', '腎結石', '膀胱癌', '腎臟腫瘤', '泌尿道感染', 'hematuria', 'urolithiasis', 'bladder cancer', 'renal cell carcinoma', 'uti'],
    biliary: ['阻塞性黃疸', '黃疸', '膽管阻塞', '膽道阻塞', '胰頭癌', '膽管癌', '總膽管結石', '肝炎', 'obstructive jaundice', 'jaundice', 'cholestasis', 'pancreatic cancer', 'cholangiocarcinoma', 'choledocholithiasis', 'hepatitis'],
  },
  rash: {
    infect: ['帶狀疱疹', '皰疹', '疱疹', '蜂窩性組織炎', '蜂窩組織炎', '病毒疹', '麻疹', '水痘', '疥瘡', 'herpes zoster', 'shingles', 'herpes', 'cellulitis', 'viral exanthem', 'measles', 'varicella', 'scabies'],
    allergy: ['蕁麻疹', '藥物疹', '過敏性休克', '全身性過敏', '過敏', '血管性水腫', '史帝文生強生', '史蒂文斯', '接觸性皮膚炎', 'urticaria', 'drug eruption', 'anaphylaxis', 'angioedema', 'sjs', 'ten', 'stevens-johnson', 'dress', 'contact dermatitis'],
    immune: ['濕疹', '異位性皮膚炎', '乾癬', '牛皮癬', '紅斑性狼瘡', '狼瘡', '脂漏性皮膚炎', 'eczema', 'atopic dermatitis', 'psoriasis', 'sle', 'lupus', 'seborrheic dermatitis'],
    bleed: ['紫斑', '紫斑症', '血小板低下', '血小板減少', '血管炎', '瘀斑', '出血點', '過敏性紫斑', 'purpura', 'itp', 'thrombocytopenia', 'vasculitis', 'petechiae', 'hsp', 'iga vasculitis', 'dic', 'ttp'],
  },
  'weight-loss': {
    tumor: ['惡性腫瘤', '癌症', '腫瘤', '胃癌', '大腸癌', '肺癌', '胰臟癌', '淋巴瘤', '食道癌', 'cancer', 'malignancy', 'tumor', 'lymphoma'],
    endocrine: ['甲狀腺亢進', '甲狀腺機能亢進', '甲亢', '葛瑞夫茲', '糖尿病', '腎上腺功能不全', 'hyperthyroidism', 'thyrotoxicosis', 'graves', 'diabetes', 'dm', 'adrenal insufficiency', 'addison'],
    gut: ['發炎性腸道疾病', '克隆氏症', '潰瘍性結腸炎', '吸收不良', '乳糜瀉', '吞嚥困難', '慢性胰臟炎', 'ibd', "crohn's", 'crohn', 'ulcerative colitis', 'malabsorption', 'celiac', 'dysphagia', 'chronic pancreatitis'],
    mind: ['憂鬱', '憂鬱症', '失智', '失智症', '厭食症', '營養不良', '自傷', '社會隔離', '照顧不足', 'depression', 'dementia', 'anorexia nervosa', 'malnutrition', 'self-harm'],
  },
  paresthesia: {
    brain: ['中風', '腦中風', '缺血性中風', '腦梗塞', '暫時性腦缺血', '小中風', '腦出血', 'stroke', 'cva', 'tia', 'transient ischemic attack', 'cerebral infarction'],
    cord: ['脊髓病變', '頸椎病', '頸椎狹窄', '頸椎壓迫', '腰椎狹窄', '神經根病變', '神經根壓迫', '椎間盤突出', '多發性硬化', '脊髓壓迫', 'myelopathy', 'radiculopathy', 'cervical spondylosis', 'spinal stenosis', 'disc herniation', 'cord compression', 'multiple sclerosis', 'ms'],
    nerve: ['周邊神經病變', '糖尿病神經病變', '腕隧道症候群', '腕管', '神經病變', '肘隧道', 'peripheral neuropathy', 'diabetic neuropathy', 'carpal tunnel', 'cts', 'neuropathy', 'cubital tunnel'],
    metabolic: ['過度換氣', '電解質', '低血鈣', '低血鉀', '低血糖', '維生素b12缺乏', '維生素 b12', '恐慌', '焦慮', 'hyperventilation', 'hypocalcemia', 'hypokalemia', 'hypoglycemia', 'b12 deficiency', 'panic', 'anxiety'],
  },
};
