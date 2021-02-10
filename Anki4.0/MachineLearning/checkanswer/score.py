from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

import json
import os
from collections import OrderedDict
from typing import List, Dict, Tuple, Iterable, Type, Union, Optional
import numpy as np
from numpy import ndarray
from transformers import AutoModel, AutoTokenizer, AutoConfig
import torch
from torch import nn, Tensor, device
from torch.utils.data import DataLoader,Dataset

class Transformer(nn.Module):
    """Huggingface AutoModel to generate token embeddings.
    Loads the correct class, e.g. BERT / RoBERTa etc.

    :param model_name_or_path: Huggingface models name (https://huggingface.co/models)
    :param max_seq_length: Truncate any inputs longer than max_seq_length
    :param model_args: Arguments (key, value pairs) passed to the Huggingface Transformers model
    :param cache_dir: Cache dir for Huggingface Transformers to store/load models
    :param tokenizer_args: Arguments (key, value pairs) passed to the Huggingface Tokenizer model
    :param do_lower_case: Lowercase the input
    """
    def __init__(self, model_name_or_path: str, max_seq_length: int = 128,
                 model_args: Dict = {}, cache_dir: Optional[str] = None,
                 tokenizer_args: Dict = {}, do_lower_case: Optional[bool] = None):
        super(Transformer, self).__init__()
        self.config_keys = ['max_seq_length']
        self.max_seq_length = max_seq_length

        if do_lower_case is not None:
            tokenizer_args['do_lower_case'] = do_lower_case

        config = AutoConfig.from_pretrained(model_name_or_path, **model_args, cache_dir=cache_dir)
        self.auto_model = AutoModel.from_pretrained(model_name_or_path, config=config, cache_dir=cache_dir)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name_or_path, cache_dir=cache_dir, **tokenizer_args)


    def forward(self, features):
        """Returns token_embeddings, cls_token"""
        output_states = self.auto_model(**features, return_dict=False)
        output_tokens = output_states[0]

        cls_tokens = output_tokens[:, 0, :]  # CLS token is first token
        features.update({'token_embeddings': output_tokens, 'cls_token_embeddings': cls_tokens, 'attention_mask': features['attention_mask']})

        if self.auto_model.config.output_hidden_states:
            all_layer_idx = 2
            if len(output_states) < 3: #Some models only output last_hidden_states and all_hidden_states
                all_layer_idx = 1

            hidden_states = output_states[all_layer_idx]
            features.update({'all_layer_embeddings': hidden_states})

        return features

    def get_word_embedding_dimension(self) -> int:
        return self.auto_model.config.hidden_size

    def tokenize(self, text: Union[str, List[str]]) -> List[int]:
        """
        Tokenizes a text and maps tokens to token-ids
        """
        if isinstance(text, str):
            return self.tokenizer.convert_tokens_to_ids(self.tokenizer.tokenize(text))
        else:
            return [self.tokenizer.convert_tokens_to_ids(self.tokenizer.tokenize(t)) for t in text]

    def get_sentence_features(self, tokens: Union[List[int], List[List[int]]], pad_seq_length: int):
        """
        Convert tokenized sentence in its embedding ids, segment ids and mask

        :param tokens:
            a tokenized sentence
        :param pad_seq_length:
            the maximal length of the sequence. Cannot be greater than self.sentence_transformer_config.max_seq_length
        :return: embedding ids, segment ids and mask for the sentence
        """
        pad_seq_length = min(pad_seq_length, self.max_seq_length, self.auto_model.config.max_position_embeddings-3) + 3 #Add space for special tokens

        if len(tokens) == 0 or isinstance(tokens[0], int):
            return self.tokenizer.prepare_for_model(tokens, max_length=pad_seq_length, padding='max_length', return_tensors='pt', truncation=True, prepend_batch_axis=True)
        else:
            return self.tokenizer.prepare_for_model(tokens[0], tokens[1], max_length=pad_seq_length, padding='max_length', return_tensors='pt', truncation='longest_first', prepend_batch_axis=True)

    def get_config_dict(self):
        return {key: self.__dict__[key] for key in self.config_keys}

    def save(self, output_path: str):
        self.auto_model.save_pretrained(output_path)
        self.tokenizer.save_pretrained(output_path)

        with open(os.path.join(output_path, 'sentence_bert_config.json'), 'w') as fOut:
            json.dump(self.get_config_dict(), fOut, indent=2)

    @staticmethod
    def load(input_path: str):
        #Old classes used other config names than 'sentence_bert_config.json'
        for config_name in ['sentence_bert_config.json', 'sentence_roberta_config.json', 'sentence_distilbert_config.json', 'sentence_camembert_config.json', 'sentence_albert_config.json', 'sentence_xlm-roberta_config.json', 'sentence_xlnet_config.json']:
            sbert_config_path = os.path.join(input_path, config_name)
            if os.path.exists(sbert_config_path):
                break

        with open(sbert_config_path) as fIn:
            config = json.load(fIn)
        return Transformer(model_name_or_path=input_path, **config)

class Pooling(nn.Module):
    """Performs pooling (max or mean) on the token embeddings.

    Using pooling, it generates from a variable sized sentence a fixed sized sentence embedding. This layer also allows to use the CLS token if it is returned by the underlying word embedding model.
    You can concatenate multiple poolings together.

    :param word_embedding_dimension: Dimensions for the word embeddings
    :param pooling_mode_cls_token: Use the first token (CLS token) as text representations
    :param pooling_mode_max_tokens: Use max in each dimension over all tokens.
    :param pooling_mode_mean_tokens: Perform mean-pooling
    :param pooling_mode_mean_sqrt_len_tokens: Perform mean-pooling, but devide by sqrt(input_length).
    """
    def __init__(self,
                 word_embedding_dimension: int,
                 pooling_mode_cls_token: bool = False,
                 pooling_mode_max_tokens: bool = False,
                 pooling_mode_mean_tokens: bool = True,
                 pooling_mode_mean_sqrt_len_tokens: bool = False,
                 ):
        super(Pooling, self).__init__()

        self.config_keys = ['word_embedding_dimension',  'pooling_mode_cls_token', 'pooling_mode_mean_tokens', 'pooling_mode_max_tokens', 'pooling_mode_mean_sqrt_len_tokens']

        self.word_embedding_dimension = word_embedding_dimension
        self.pooling_mode_cls_token = pooling_mode_cls_token
        self.pooling_mode_mean_tokens = pooling_mode_mean_tokens
        self.pooling_mode_max_tokens = pooling_mode_max_tokens
        self.pooling_mode_mean_sqrt_len_tokens = pooling_mode_mean_sqrt_len_tokens

        pooling_mode_multiplier = sum([pooling_mode_cls_token, pooling_mode_max_tokens, pooling_mode_mean_tokens, pooling_mode_mean_sqrt_len_tokens])
        self.pooling_output_dimension = (pooling_mode_multiplier * word_embedding_dimension)

    def forward(self, features: Dict[str, Tensor]):
        token_embeddings = features['token_embeddings']
        cls_token = features['cls_token_embeddings']
        attention_mask = features['attention_mask']

        ## Pooling strategy
        output_vectors = []
        if self.pooling_mode_cls_token:
            output_vectors.append(cls_token)
        if self.pooling_mode_max_tokens:
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            token_embeddings[input_mask_expanded == 0] = -1e9  # Set padding tokens to large negative value
            max_over_time = torch.max(token_embeddings, 1)[0]
            output_vectors.append(max_over_time)
        if self.pooling_mode_mean_tokens or self.pooling_mode_mean_sqrt_len_tokens:
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)

            #If tokens are weighted (by WordWeights layer), feature 'token_weights_sum' will be present
            if 'token_weights_sum' in features:
                sum_mask = features['token_weights_sum'].unsqueeze(-1).expand(sum_embeddings.size())
            else:
                sum_mask = input_mask_expanded.sum(1)

            sum_mask = torch.clamp(sum_mask, min=1e-9)

            if self.pooling_mode_mean_tokens:
                output_vectors.append(sum_embeddings / sum_mask)
            if self.pooling_mode_mean_sqrt_len_tokens:
                output_vectors.append(sum_embeddings / torch.sqrt(sum_mask))

        output_vector = torch.cat(output_vectors, 1)
        features.update({'sentence_embedding': output_vector})
        return features

    def get_sentence_embedding_dimension(self):
        return self.pooling_output_dimension

    def get_config_dict(self):
        return {key: self.__dict__[key] for key in self.config_keys}

    def save(self, output_path):
        with open(os.path.join(output_path, 'config.json'), 'w') as fOut:
            json.dump(self.get_config_dict(), fOut, indent=2)

    @staticmethod
    def load(input_path):
        with open(os.path.join(input_path, 'config.json')) as fIn:
            config = json.load(fIn)

        return Pooling(**config)

def pytorch_cos_sim(a: Tensor, b: Tensor):
    """
    Computes the cosine similarity cos_sim(a[i], b[j]) for all i and j.
    This function can be used as a faster replacement for 1-scipy.spatial.distance.cdist(a,b)
    :return: Matrix with res[i][j]  = cos_sim(a[i], b[j])
    """
    if not isinstance(a, torch.Tensor):
        a = torch.tensor(a)

    if not isinstance(b, torch.Tensor):
        b = torch.tensor(b)

    if len(a.shape) == 1:
        a = a.unsqueeze(0)

    if len(b.shape) == 1:
        b = b.unsqueeze(0)

    a_norm = torch.nn.functional.normalize(a, p=2, dim=1)
    b_norm = torch.nn.functional.normalize(b, p=2, dim=1)
    return torch.mm(a_norm, b_norm.transpose(0, 1))


class SentenceTransformer(nn.Sequential):
    """
    Loads or create a SentenceTransformer model, that can be used to map sentences / text to embeddings.

    :param model_name_or_path: If it is a filepath on disc, it loads the model from that path. If it is not a path, it first tries to download a pre-trained SentenceTransformer model. If that fails, tries to construct a model from Huggingface models repository with that name.
    :param modules: This parameter can be used to create custom SentenceTransformer models from scratch.
    :param device: Device (like 'cuda' / 'cpu') that should be used for computation. If None, checks if a GPU can be used.
    """
    def __init__(self, model_path, modules: Iterable[nn.Module] = None, device: str = None):

      with open(os.path.join(model_path, 'modules.json')) as fIn:
          contained_modules = json.load(fIn)

      modules = OrderedDict()
      for module_config in contained_modules:
        print(module_config['type'])
      for module_config in contained_modules:
          module_class = Transformer if module_config['type'] == "sentence_transformers.models.Transformer" else Pooling
          module = module_class.load(os.path.join(model_path, module_config['path']))
          modules[module_config['name']] = module


      if modules is not None and not isinstance(modules, OrderedDict):
          modules = OrderedDict([(str(idx), module) for idx, module in enumerate(modules)])

      super().__init__(modules)
      if device is None:
          device = "cuda" if torch.cuda.is_available() else "cpu"

      self._target_device = torch.device(device)


    def encode(self, sentences: Union[str, List[str], List[int]],
               batch_size: int = 32,
               output_value: str = 'sentence_embedding',
               convert_to_numpy: bool = True,
               convert_to_tensor: bool = False,
               is_pretokenized: bool = False,
               device: str = None,
               num_workers: int = 0) -> Union[List[Tensor], ndarray, Tensor]:
        """
        Computes sentence embeddings

        :param sentences: the sentences to embed
        :param batch_size: the batch size used for the computation
        :param output_value:  Default sentence_embedding, to get sentence embeddings. Can be set to token_embeddings to get wordpiece token embeddings.
        :param convert_to_numpy: If true, the output is a list of numpy vectors. Else, it is a list of pytorch tensors.
        :param convert_to_tensor: If true, you get one large tensor as return. Overwrites any setting from convert_to_numpy
        :param is_pretokenized: If is_pretokenized=True, sentences must be a list of integers, containing the tokenized sentences with each token convert to the respective int.
        :param device: Which torch.device to use for the computation
        :param num_workers: Number of background-workers to tokenize data. Set to positive number to increase tokenization speed
        :return:
           By default, a list of tensors is returned. If convert_to_tensor, a stacked tensor is returned. If convert_to_numpy, a numpy matrix is returned.
        """
        self.eval()
        input_was_string = False
        if isinstance(sentences, str): #Cast an individual sentence to a list with length 1
            sentences = [sentences]
            input_was_string = True

        if device is None:
            device = self._target_device

        self.to(device)

        all_embeddings = []
        length_sorted_idx = np.argsort([self._text_length(sen) for sen in sentences])
        sentences_sorted = [sentences[idx] for idx in length_sorted_idx]
        inp_dataset = EncodeDataset(sentences_sorted, model=self, is_tokenized=is_pretokenized)
        inp_dataloader = DataLoader(inp_dataset, batch_size=batch_size, collate_fn=self.smart_batching_collate_text_only, num_workers=num_workers, shuffle=False)

        iterator = inp_dataloader

        for features in iterator:
            for feature_name in features:
                features[feature_name] = features[feature_name].to(device)

            with torch.no_grad():
                out_features = self.forward(features)
                embeddings = out_features[output_value]

                if output_value == 'token_embeddings':
                    #Set token embeddings to 0 for padding tokens
                    input_mask = out_features['attention_mask']
                    input_mask_expanded = input_mask.unsqueeze(-1).expand(embeddings.size()).float()
                    embeddings = embeddings * input_mask_expanded

                embeddings = embeddings.detach()

                # fixes for #522 and #487
                # to avoid oom problems on gpu with large datasets
                if convert_to_numpy:
                    embeddings = embeddings.cpu()

                all_embeddings.extend(embeddings)

        all_embeddings = [all_embeddings[idx] for idx in np.argsort(length_sorted_idx)]

        if convert_to_tensor:
            all_embeddings = torch.stack(all_embeddings)
        elif convert_to_numpy:
            all_embeddings = np.asarray([emb.numpy() for emb in all_embeddings])

        if input_was_string:
            all_embeddings = all_embeddings[0]

        return all_embeddings

    def tokenize(self, text: str):
        """
        Tokenizes the text
        """
        return self._first_module().tokenize(text)

    def get_sentence_features(self, *features):
        return self._first_module().get_sentence_features(*features)


    def _first_module(self):
        """Returns the first module of this sequential embedder"""
        return self._modules[next(iter(self._modules))]

    def smart_batching_collate_text_only(self, batch):
        """
        Transforms a batch from a SmartBatchingDataset to a batch of tensors for the model.
        Here, batch is a list of texts

        :param batch:
            a batch from a SmartBatchingDataset
        :return:
            a batch of tensors for the model
        """

        max_seq_len = max([self._text_length(text) for text in batch])
        feature_lists = {}

        for text in batch:
            sentence_features = self.get_sentence_features(text, max_seq_len)
            for feature_name in sentence_features:
                if feature_name not in feature_lists:
                    feature_lists[feature_name] = []

                feature_lists[feature_name].append(sentence_features[feature_name])

        for feature_name in feature_lists:
            feature_lists[feature_name] = torch.cat(feature_lists[feature_name])

        return feature_lists

    def _text_length(self, text: Union[List[int], List[List[int]]]):
        """
        Help function to get the length for the input text. Text can be either
        a list of ints (which means a single text as input), or a tuple of list of ints
        (representing several text inputs to the model).
        """
        if len(text) == 0 or isinstance(text[0], int):
            return len(text)
        else:
            return sum([len(t) for t in text])
            
class EncodeDataset(Dataset):
    def __init__(self,
                 sentences: Union[List[str], List[int]],
                 model: SentenceTransformer,
                 is_tokenized: bool = True):
        """
        EncodeDataset is used by SentenceTransformer.encode method. It just stores
        the input texts and returns a tokenized version of it.
        """
        self.model = model
        self.sentences = sentences
        self.is_tokenized = is_tokenized


    def __getitem__(self, item):
        return self.sentences[item] if self.is_tokenized else self.model.tokenize(self.sentences[item])


    def __len__(self):
        return len(self.sentences)

def init():
  global model
  global analyzer
  model_path = os.path.join(os.getenv('AZUREML_MODEL_DIR'), 'models/')
  model = SentenceTransformer(model_path)
  analyzer = SentimentIntensityAnalyzer()

# Handle requests to the service
def run(data):
    try:
        data = json.loads(data)
        user_answer = data["user_answer"]
        bot_answer = data["bot_answer"]
        print(user_answer, bot_answer)

        user_sentiment = analyzer.polarity_scores(user_answer)["compound"]
        bot_sentiment = analyzer.polarity_scores(bot_answer)["compound"]

        print(f"sentiment : {user_sentiment} - 0.15 <= {bot_sentiment} <= {user_sentiment} + 0.15", not (user_sentiment - 0.15 <= bot_sentiment <= user_sentiment + 0.15))
        if not (user_sentiment - 0.15 <= bot_sentiment <= user_sentiment + 0.15) :
            print("result : 0")
            return {"result":0,"user_sentimet":user_sentiment,"bot_sentimet":bot_sentiment,"error":None}
        emb1 = model.encode(user_answer)
        emb2 = model.encode(bot_answer)
        cos_sim = pytorch_cos_sim(emb1, emb2)[0][0].item()

        return {"result":cos_sim,"user_sentimet":user_sentiment,"bot_sentimet":bot_sentiment,"error":None}
    except Exception as e:
        error = str(e)
        return {"result":None,"user_sentimet":None,"bot_sentimet":None,"error":error}
